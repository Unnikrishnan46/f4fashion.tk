const { response } = require('express');
var express = require('express');

const paypal = require('paypal-rest-sdk');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
var adminHelpers = require('../helpers/admin-helpers');
const { Client } = require('twilio/lib/twiml/VoiceResponse');
const { Db } = require('mongodb');





//paypal
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AZCqO4Vy5r1Y12s6EG-yCc45ECpQspai37osd5k2o9lv8le9A6cfUS1k3odBXhu2xqOh-4IGMIhNbSqP',
  'client_secret': 'EAFq6n97dt9FIq93JaYK-ztAUIsOgO7V1dYxmH7Glrs1rSaeqBB3B8PUWbK3tAP1Df5aIlxVuteM9BE5'
});
//paypal


const verifyLogin = (req, res, next) => {
  if (req.session.loggedin) {
    next();
  } else {
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function (req, res, next) {
  let noUser = null
  if (req.session.loggedin) {
    let user = req.session.user
    let cartCount = null
    let wishCount = null
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
      wishCount = await userHelpers.getWishlistCount(req.session.user._id);
    }
    console.log(user);
    productHelpers.getAllProducts().then((products) => {
      res.render('user/view-products', { products, user, cartCount, wishCount });
    })
  } else {
    productHelpers.getAllProducts().then((products) => {
      console.log("products suii")
      console.log(products)
      res.render('user/view-products', { products })
    })
  }
  console.log(noUser)
});

router.get('/login', (req, res) => {
  if (req.session.loggedin) {
    res.redirect('/')
  } else {
    res.render('user/login', { 'loginErr': req.session.loginErr, blocked: req.session.blocked })
    req.session.blocked = false
    req.session.loginErr = false
  }
  res.render('user/login')
});

router.get('/signup', (req, res) => {
  res.render('user/signup')
})

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    userHelpers.checkEmail(req.body.email)
    console.log(req.body.email);
    res.redirect('/login')
  })
})

router.post('/login', async (req, res) => {

  await userHelpers.doLogin(req.body).then((response) => {
    console.log("jumangi")
    console.log(response)
    if (response.blocked) {
      console.log("the user is blocked");
      req.session.blocked = true;
      res.redirect('/login');
    } else {
      if (response.status) {
        console.log("this user is not blocked")
        req.session.user = response.user
        req.session.loggedin = false
        req.session.phonenumber = response.user.phonenumber
        res.redirect('/otp');
      } else {
        req.session.loginErr = true
        res.redirect('/login');
      }
    }
  })
});

//otp

router.get('/otp', (req, res) => {
  if (req.session.loggedin) {
    res.redirect('/');
  } else {
    let user=req.session.user;
    console.log('hai')
    console.log(user.phonenumber)
    console.log(req.session.user)
    userHelpers.sendOtp(req.session.user)
    res.render("user/otplogin", { otpErr: req.session.otpErr })
    req.session.otpErr = false;
  }
})



router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/')
})



router.post('/verifyotp', (req, res) => {
  userHelpers.verifyotp(req.session.user, req.body.otpval).then((otpApproved) => {
    console.log(otpApproved);
    if (otpApproved) {
      req.session.otpErr = false
      req.session.loggedin = true
      res.redirect('/')
    } else {
      console.log("OTP login failed")
      req.session.otpErr = true
      res.redirect('/otp');
    }
  })
})

router.get('/resendOtp', (req, res) => {
  res.redirect('/otp');
})

router.get('/home', (req, res) => {
  productHelpers.getAllProducts().then(async (products) => {
    let user = req.session.user
    if (user) {
      let wishCount = await userHelpers.getWishlistCount(req.session.user._id);
      let cartCount = await userHelpers.getCartCount(req.session.user._id)
      res.render("user/view-products", { user, products ,wishCount,cartCount})
    }
    if (req.session.loggedin) {
      res.render("user/view-products", { user, products });
    } else {
      res.render("user/view-products", { user, products });
    }
  })
})

//product details
router.get('/product-details/:id', async (req, res) => {
  let user = req.session.user
  let id = req.params.id;
  await productHelpers.getProductDetails(id).then(async (productDetails) => {
    if (user) {
      let wishCount = await userHelpers.getWishlistCount(req.session.user._id);
      let cartCount = await userHelpers.getCartCount(req.session.user._id)
      res.render('user/product-details', { user, productDetails, wishCount, cartCount });
    } else {
      res.render('user/product-details', { user, productDetails })
    }

  })
})


//cart

router.get('/cart', verifyLogin, async (req, res, next) => {
  let wishCount = await userHelpers.getWishlistCount(req.session.user._id);
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  let cartEmpty;
  let user = req.session.user
  let products = await userHelpers.getCartProducts(req.session.user._id);
  let totalValue = 0
  if (products.length > 0) {
    totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  }
  req.session.totalValue = totalValue

  req.session.cartCount = cartCount

  console.log('***' + req.session.user._id);
  console.log(products.length)
  if (products.length == 0) {
    cartEmpty = true
  }
  res.render('user/cart', { products, user: req.session.user._id, totalValue: req.session.totalValue, cartCount: req.session.cartCount, user, 'cartempty': cartEmpty, wishCount });
});

router.get("/add-to-cart/:id", verifyLogin, (req, res) => {
  console.log("api call");
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    //res.redirect('/')
    res.json({ status: true })
  })
})

router.post('/change-product-quantity', verifyLogin, (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response);
  })
})

//remove from cart

router.get("/remove-product", verifyLogin, (req, res, next) => {
  console.log(req.query);
  console.log(req.query.cartId);
  console.log(req.query.proId);

  userHelpers.removeProduct(req.query).then((response) => {
    res.redirect("/cart");
  });
});


router.get('/place-order', verifyLogin, async (req, res) => {
  let user = req.session.user
  let userId = req.session.user._id
  let address = await userHelpers.getAddress(userId)
  let address1 = await userHelpers.getDefaultAddress1(userId);
  let address2 = await userHelpers.getDefaultAddress2(userId);
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  if (address1 != null) {
    let addDefault1 = true
    console.log("address 1 suii")
    res.render('user/place-order', { total, user, address, addDefault1 });
  }
  if (address2 != null) {
    let addDefault2 = true
    console.log("address 2 suiii")
    res.render('user/place-order', { total, user, address, addDefault2 });
  }
  res.render('user/place-order', { total, user })
})

router.post('/place-order', async (req, res) => {
  console.log('place order coupen code here')
  console.log(req.body.code)
  let products = await userHelpers.getCartProductsList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  let coupen = await userHelpers.applyCoupen(req.body.code)
  if (coupen.length >= 1) {
    totalPrice = parseInt(totalPrice) - parseInt(coupen[0].value)
  }

  console.log('chik')
  console.log(coupen);
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
    if (req.body["paymentmethod"] === 'cod') {
      res.json({ codSuccess: true })
      console.log(req.body.paymentmethod)
      console.log('laude')

    } else if (req.body["paymentmethod"] === 'razorpay') {
      userHelpers.generateRazorpay(orderId, totalPrice).then((order) => {
        console.log('chuthiye')
        res.json({ order, razorSuccess: true })
        console.log(order)
      })
    } else if(req.body["paymentmethod"] ==='paypal'){
      console.log("paypal")
      console.log('wakkanda for ever')
      res.json({ totalPrice: totalPrice, orderId: orderId });
    }
  })
  console.log(req.body)
})


router.post('/verify-payment', (req, res) => {
  console.log('hawa hawa')
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then(() => {
    currentStatus = 'placed'

    userHelpers.changePaymentStatus(req.body['order[receipt]'], currentStatus).then(() => {
      console.log('payment successfull')
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err)
    currentStatus = 'payment incompleted'
    userHelpers.changePaymentStatus(req.body['order[receipt]'], currentStatus).then(() => {
      console.log("payment failed")
      res.json({ status: false })
    })
  })
})



router.get('/order-success', async (req, res) => {
  let user = req.session.user
  res.render('user/order-success', { user })

})

router.get('/orders', verifyLogin, async (req, res) => {
  let user = req.session.user
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  console.log(orders)
  console.log('suiii')
  res.render('user/orders', { user: req.session.user, orders, user })
})

router.get('/view-order-products/:id', async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products', { user: req.session.user, products });
})

router.get('/cancel-order/:id', (req, res) => {
  const orderId = req.params.id
  userHelpers.cancelOrder(orderId).then((response) => {
    console.log('canceled status')
    console.log(response)
    res.redirect('/orders')
  })
})

router.post("/paypal-payment", (req, res) => {
  console.log('paypal suii')
  console.log(req.body);
  const create_payment_json = {
    "intent": "sale",
    "payer": {
      "payment_method": "paypal"
    },
    "redirect_urls": {
      "return_url": "http://localhost:3000/order-success",
      "cancel_url": "http://localhost:3000/place-order"
    },
    "transactions": [{
      "item_list": {
        "items": [{
          "name": "F4FASHION",
          "sku": "001",
          "price": req.body.totalPrice,
          "currency": "USD",
          "quantity": 1
        }]
      },
      "amount": {
        "currency": "USD",
        "total": req.body.totalPrice
      },
      "description": "Hat for the best team ever"
    }]
  }
  paypal.payment.create(create_payment_json, function (error, payment) {
    console.log('gangsta')
    if (error) {
      throw error;
    } else {
      console.log('gangsta')
      console.log(payment);
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === 'approval_url') {
          console.log(payment.links[i].href)
          res.json({ forwardLink: payment.links[i].href })
        }
      }
    }
  });
})

//shop now

router.get('/shopnow', async (req, res) => {
  let user = req.session.user
  let wishCount
  let cartCount
  if (req.session.user) {
    wishCount = await userHelpers.getWishlistCount(req.session.user._id);
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }


  console.log(user)
  if (user) {
    let cartCount = await userHelpers.getCartCount(req.session.user._id)
    req.session.cartCount = cartCount
  }
  let products = await productHelpers.getAllProducts().then((products) => {
    res.render('user/shopnow', { products, user, wishCount, cartCount });
  })
})

//profile

router.get('/profile', verifyLogin, async (req, res) => {
  let user = req.session.user
  let userId = req.session.user._id
  let cartCount = await userHelpers.getCartCount(userId);
  let orderCount = await userHelpers.getUserOrdersCount(userId)
  let wishlistCount = await userHelpers.getWishlistCount(userId)
  let userDetails = await userHelpers.userDetails(userId)
  console.log(userId)
  console.log("kayo")
  res.render('user/profile', { user, userDetails, orderCount, wishlistCount, cartCount, userId })
})


router.get("/edit-profile", (req, res) => {
  let userId = req.session.user._id
  let user = req.session.user
  res.render('user/edit-profile', { user, userId });
})

router.post('/edit-profile/:id', async (req, res) => {
  console.log('profile body coming')
  console.log(req.body)
  let userId = req.params.id
  let userDetails = req.body
  userHelpers.editProfile(userId, userDetails).then((response) => {
    if (req.files.image == null) {
      let imageErr = true
      res.render('user/edit-profile', { imageErr, user, userId })
    } else {
      let image = req.files.image
      image.mv('./public/profile-images/' + userId + '.jpg', (err, done) => {
        if (!err) {
          console.log('response here we go')
          console.log(response);
          if (response) {
            res.redirect('/profile')
          }
        } else {
          console.log(err);
        }
      })
    }

  })
})


router.get('/add-to-wishlist/:id', (req, res) => {
  let userId = req.session.user._id;
  let proId = req.params.id
  console.log(proId, userId)
  userHelpers.addToWishlist(proId, userId).then((response) => {
    res.json({ status: true })
    console.log("res yo yo")
    console.log(response)
  })
  // res.redirect('/');
})


router.get('/wishlist', verifyLogin, async (req, res) => {
  
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  let wishlistEmpty;
  let user = req.session.user
  let userId = req.session.user._id
  let wish = await userHelpers.getWishlist(userId)
  let wishCount = await userHelpers.getWishlistCount(userId);
  console.log(wishCount)
  let wishlist = {}
  for (let i = 0; i < wish.length; i++) {
    Object.assign(wishlist, wish[i]);
  }
  console.log(wish.length);
  if (wish.length == 0) {
    wishlistEmpty = true;
  }
  res.render('user/wishlist', { wish, user, wishlistEmpty, wishCount ,cartCount});
})

router.get('/remove-product-wishlist/:id', (req, res) => {
  let userId = req.session.user._id;
  let proId = req.params.id;
  console.log("visca barsa")
  console.log(userId)
  console.log(proId);
  userHelpers.removeWishlist(userId, proId)
  res.redirect('/wishlist')
})


router.post('/check-coupen', async (req, res) => {
  let code = req.body.code
  console.log(code)
  await userHelpers.checkCoupen(code).then((data) => {
    let value = data.value
    res.json({ value })
  }).catch(() => {
    res.json({ err: true })
  })
})


router.post('/search', (req, res) => {
  let search = req.body.search
  console.log(search)
  userHelpers.search(search).then(async (products) => {
    console.log("but y")
    console.log(products)
    let user = req.session.user
    res.render('user/shopnow', { products, user })
  }).catch(async () => {
    let user = req.session.user
    res.render('user/shopnow', { products, user })
  })
})


router.get('/mensOnly', async (req, res) => {
  let products = await userHelpers.getMensOnly()
  if (req.session.user) {
    let user = req.session.user;
    let wishCount = await userHelpers.getWishlistCount(req.session.user._id);
    let cartCount = await userHelpers.getCartCount(req.session.user._id)
    res.render("user/shopnow", { products, wishCount, cartCount, user })
  }
  console.log("routr working")
  console.log(products)
  res.render("user/shopnow", { products })
})

router.get("/womensOnly", async (req, res) => {
  let products = await userHelpers.getMomensOnly()
  if (req.session.user) {
    let user = req.session.user;
    let wishCount = await userHelpers.getWishlistCount(req.session.user._id);
    let cartCount = await userHelpers.getCartCount(req.session.user._id)
    res.render("user/shopnow", { products, wishCount, cartCount, user })
  }
  console.log(products);
  res.render('user/shopnow', { products })
})

router.get('/kidsOnly', async (req, res) => {
  let products = await userHelpers.getKidsOnly()
  if (req.session.user) {
    let user = req.session.user;
    let wishCount = await userHelpers.getWishlistCount(req.session.user._id);
    let cartCount = await userHelpers.getCartCount(req.session.user._id)
    res.render("user/shopnow", { products, wishCount, cartCount, user })
  }
  console.log(products)
  res.render("user/shopnow", { products })
})


router.get('/add-address', async (req, res) => {
  let userId = req.session.user._id
  let address = await userHelpers.getAddress(userId)
  if (address) {
    console.log("suii address one")
    res.render('user/add-address', { address });
  } else {
    console.log("no address");
    res.render('user/add-address');
  }
})

router.get('/add-address1', async (req, res) => {
  let address1 = true
  let showAddress = true
  res.render('user/add-address', { address1, showAddress });
})

router.get('/add-address2', async (req, res) => {
  let address2 = true
  let showAddress = true
  res.render('user/add-address', { address2, showAddress });
})


router.post('/add-address1', async (req, res) => {
  let userId = req.session.user._id;
  let address = req.body.address;
  let pincode = req.body.pincode;
  let state = req.body.state;
  let district = req.body.district;
  let town = req.body.town;
  let address1 = { address: address, pincode: pincode, state, state, district: district, town: town, default: null }
  await userHelpers.addAddress1(userId, address1).then((response) => {
    if (response) {
      console.log("address1 post working");
      console.log(response);
      res.redirect('/add-address')
    }
  })
})

router.post('/add-address2', async (req, res) => {
  let userId = req.session.user._id;
  let address = req.body.address;
  let pincode = req.body.pincode;
  let state = req.body.state;
  let district = req.body.district;
  let town = req.body.town;
  let address2 = { address: address, pincode: pincode, state, state, district: district, town: town, default: null }
  await userHelpers.addAddress2(userId, address2).then((response) => {
    if (response) {
      console.log("address post working");
      console.log(response);
      res.redirect('/add-address')
    }
  })
})


router.get('/edit-address1', async (req, res) => {
  console.log("edit-address1 router")
  let userId = req.session.user._id
  let address = await userHelpers.getAddress(userId)
  let editAddress = true
  let address1 = true
  let addressOne = address.address1
  console.log(addressOne)
  res.render('user/add-address', { editAddress, address1, address, addressOne });
})

router.get('/edit-address2', async (req, res) => {
  console.log("edit address 2")
  let userId = req.session.user._id
  let address = await userHelpers.getAddress(userId)
  let editAddress = true
  let address2 = true
  let addressOne = address.address2;
  res.render('user/add-address', { editAddress, address2, address, addressOne });
})

router.post('/edit-address1', async (req, res) => {
  let userId = req.session.user._id;
  let address = req.body.address;
  let pincode = req.body.pincode;
  let state = req.body.state;
  let district = req.body.district;
  let town = req.body.town;
  let address1 = { address: address, pincode: pincode, state, state, district: district, town: town, default: null }
  await userHelpers.updateAddress1(userId, address1)
  res.redirect('/add-address')
})


router.post('/edit-address2', async (req, res) => {
  let userId = req.session.user._id;
  let address = req.body.address;
  let pincode = req.body.pincode;
  let state = req.body.state;
  let district = req.body.district;
  let town = req.body.town;
  let address2 = { address: address, pincode: pincode, state, state, district: district, town: town, default: null }
  await userHelpers.updateAddress2(userId, address2)
  res.redirect('/add-address')
})


router.get('/default-address1', async (req, res) => {
  let userId = req.session.user._id;
  await userHelpers.addressDefault1(userId).then((response) => {
    console.log(response);
    res.redirect('/add-address')
  })
})


router.get('/default-address2', async (req, res) => {
  let userId = req.session.user._id;
  await userHelpers.addressDefault2(userId).then((response) => {
    console.log(response);
    res.redirect('/add-address')
  })
})

router.get('/change-password', (req, res) => {
  res.render("user/change-password")
})

router.post('/change-password', async (req, res) => {
  let userId = req.session.user._id
  let password = req.body.password;
  let confirmPassword = req.body.confirmPassword
  await userHelpers.changePassword(userId, password).then((response) => {
    if (response) {
      res.redirect('/profile')
    }
  })
  console.log(req.body);
})


router.post("/filter-price", async (req, res) => {
  let miniValue = req.body.minValue
  let maxValue = req.body.maxValue
  console.log("filter suii");
  console.log(miniValue, maxValue)
  await userHelpers.filterPrice(miniValue, maxValue)
  console.log(req.body);
})



module.exports = router;
