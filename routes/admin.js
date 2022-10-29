var express = require('express');
const { response } = require('../app');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
var adminHelpers = require('../helpers/admin-helpers');

let sessions;

const adminVerify = (req, res, next) => {
  sessions = req.session
  if (sessions.userId) {
    next()
  } else {
    res.redirect('/admin/login')
  }
}



/* GET users listing. */
router.get('/', adminVerify, async function (req, res,) {
  if(req.session.userId){
    console.log("Admin here")
  }
  let jan = await adminHelpers.getOrderMonthJan()
  let feb = await adminHelpers.getOrderMonthFeb()
  let march = await adminHelpers.getOrderMonthMarch()
  let april = await adminHelpers.getOrderMonthApril()
  let may = await adminHelpers.getOrderMonthMay()
  let june = await adminHelpers.getOrderMonthJune()
  let july = await adminHelpers.getOrderMonthJuly()
  let aug = await adminHelpers.getOrderMonthAug()
  let sept = await adminHelpers.getOrderMonthSept()
  let oct = await adminHelpers.getOrderMonthOct()
  let nov = await adminHelpers.getOrderMonthNov()
  let des = await adminHelpers.getOrderMonthDes()
  let totalOrders = await adminHelpers.getTotalOrders()
   let totalAmount = await adminHelpers.getTotalSalesAmount()
   let totalAmountSum = totalAmount[0].totalSum
  let totalProducts = await adminHelpers.getTotalProductsCount()
  let ProductReport = await adminHelpers.getProductReport();
  console.log("month here")
  console.log(totalProducts);
  res.render('admin/dashboard', { admin: true, totalOrders, totalAmountSum, totalProducts, jan, feb, march, april, may, june, july, aug, sept, oct, nov, des, ProductReport });
});


router.get('/allproducts', adminVerify, function (req, res,) {
  productHelper.getAllProducts().then((products) => {
    res.render('admin/view-products', { admin: true, products });
  })
});



router.get('/dashboard', adminVerify, async (req, res) => {

  let jan = await adminHelpers.getOrderMonthJan()
  let feb = await adminHelpers.getOrderMonthFeb()
  let march = await adminHelpers.getOrderMonthMarch()
  let april = await adminHelpers.getOrderMonthApril()
  let may = await adminHelpers.getOrderMonthMay()
  let june = await adminHelpers.getOrderMonthJune()
  let july = await adminHelpers.getOrderMonthJuly()
  let aug = await adminHelpers.getOrderMonthAug()
  let sept = await adminHelpers.getOrderMonthSept()
  let oct = await adminHelpers.getOrderMonthOct()
  let nov = await adminHelpers.getOrderMonthNov()
  let des = await adminHelpers.getOrderMonthDes()
  let totalOrders = await adminHelpers.getTotalOrders()
  let totalAmount = await adminHelpers.getTotalSalesAmount()
  let totalAmountSum = totalAmount[0].totalSum
  let totalProducts = await adminHelpers.getTotalProductsCount()
  let ProductReport = await adminHelpers.getProductReport();
  console.log("month here")
  console.log(ProductReport);
  res.render("admin/dashboard", { admin: true, totalOrders, totalProducts, jan, feb, march, april, may, june, july, aug, sept, oct, nov, des ,totalAmountSum,ProductReport});
})



router.get('/login', (req, res) => {
  sessions = req.session
  if (sessions.userId) {
    res.redirect('/admin')
  } else {
    // res.render('admin/admin-login')
    res.render('admin/admin-login', { "loginErr": req.session.loginErr  ,admin: true})
    req.session.loginErr = false

  }
})


router.post('/login', (req, res) => {
  adminHelpers.doAdminLogin(req.body).then((response) => {
    if (response.status) {
      sessions = req.session
      sessions.userId = req.body.username
      console.log(sessions.userId)
      res.redirect('/admin')
    } else {
      req.session.loginErr = "Invalid username or password"
      let loginErr = req.session.loginErr
      console.log('admin login failed')
      res.render('admin/admin-login', { loginErr })
    }

  })
})



router.get('/users', adminVerify, (req, res) => {
  adminHelpers.getAllUsers().then((allUserDetails) => {
    res.render('admin/view-users', { allUserDetails, admin: true });
  })
});

//all users
// block user
router.get("/block/:id", (req, res) => {
  const proId = req.params.id;
  console.log(proId);
  adminHelpers.blockUser(proId).then((response) => {
    console.log(response);
    res.redirect("/admin/users");
  });
});

// unblock user
router.get("/unblock/:id", (req, res) => {
  const proId = req.params.id;
  adminHelpers.unblockUser(proId).then((response) => {
    res.redirect("/admin/users");
  });
});







router.get('/add-product', adminVerify, async (req, res) => {
  let mainCate = await productHelpers.getMainCategory()
  let subCate = await productHelpers.getSubCategory()
  res.render('admin/add-product', { mainCate, subCate, admin: true })
})

router.post('/add-product', (req, res) => {
  console.log(req.body);
  console.log(req.files.image);

  productHelpers.addProduct(req.body, (id) => {
    let image1 = req.files.image1
    let image2 = req.files.image2
    let image3 = req.files.image3
    let image4 = req.files.image4
    image1.mv('./public/product-images/' + id + '.jpg')
    image2.mv('./public/product-images2/' + id + '.jpg')
    image3.mv('./public/product-images3/' + id + '.jpg')
    image4.mv('./public/product-images4/' + id + '.jpg',(err,done)=>{
      if(!err){
        res.redirect('/admin/add-product');
      }else{
        console.log(err)
      }
    })
  });
})

router.get('/delete-product/:id', (req, res) => {
  let proId = req.params.id
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/allproducts')
  })
})

router.get('/edit-product/:id', async (req, res) => {
  let mainCate = await productHelpers.getMainCategory()
  let subCate = await productHelpers.getSubCategory()
  let product = await productHelpers.getProductDetails(req.params.id)
  console.log("kabaraow math")
  console.log(product);
  res.render('admin/edit-product', { product, admin: true, mainCate, subCate })
})

router.post('/edit-product/:id', (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    let id = req.params.id

    let image1 = req.files.image1
    let image2 = req.files.image2
    let image3 = req.files.image3
    let image4 = req.files.image4
    image1.mv('./public/product-images/' + id + '.jpg')
    image2.mv('./public/product-images2/' + id + '.jpg')
    image3.mv('./public/product-images3/' + id + '.jpg')
    image4.mv('./public/product-images4/' + id + '.jpg')
    console.log("image response")
    console.log(response)

    res.redirect('/admin/allproducts')
  })
})


router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login")
})

//category managment

router.get("/add-category", adminVerify, (req, res) => {
  res.render("admin/add-category", { admin: true })
})

router.post("/add-category", adminVerify, (req, res) => {
  console.log("category here")
  productHelpers.addCategory(req.body.category)
  console.log(req.body.category)
  res.redirect('/admin/allproducts');
})

router.get('/add-subcategory', async (req, res) => {
  res.render('admin/add-subcategory', { admin: true });
})

router.post('/add-subcategory', (req, res) => {
  productHelpers.addSubCategory(req.body.subcategory);
  console.log(req.body.subcategory);
  res.redirect('/admin/allproducts');
})


router.get("/allorders", async (req, res) => {
  let allOrders = await adminHelpers.getAllOrders()
  console.log("All orders coming")
  console.log(allOrders)
  let allOrdersObj = {}
  for (let i = 0; i < allOrders.length; i++) {
    console.log()
  }
  console.log(allOrders[0].status)
  res.render('admin/order-management', { admin: true, allOrders })
})

router.get('/orderPacking/:id', (req, res) => {
  const orderId = req.params.id
  adminHelpers.statusPacking(orderId).then((response) => {
    console.log(response);
    res.redirect('/admin/allorders')
  })
});


router.get('/ordershipped/:id', (req, res) => {
  const orderId = req.params.id;
  adminHelpers.statusShipped(orderId).then((response) => {
    console.log(response)
    res.redirect('/admin/allorders')
  })
});

router.get('/orderDelivered/:id', (req, res) => {
  console.log('order delivered working')
  const orderId = req.params.id;
  adminHelpers.statusDelivered(orderId).then((response) => {
    console.log(response);
    res.redirect('/admin/allorders')
  })
})


router.get('/coupens', async (req, res) => {
  let coupenDetails = await adminHelpers.getCoupenDetails()
  console.log("coupen dta here")
  console.log(coupenDetails)
  res.render('admin/coupen', { admin: true, coupenDetails })
})


router.get('/add-coupen', (req, res) => {
  res.render('admin/add-coupen', { admin: true })
})

router.post("/add-coupen", (req, res) => {
  let coupenData = req.body;
  adminHelpers.addCoupen(coupenData);
  res.redirect("/admin/add-coupen")
})

router.get("/delete-coupen/:id", (req, res) => {
  let coupenId = req.params.id;
  adminHelpers.deleteCoupen(coupenId);
  console.log(coupenId)
  res.redirect("/admin/coupens");
})


router.get('/sales-report', async (req, res) => {
  let salesReport = await adminHelpers.salesReport()
  console.log('oh ringa ringa')
  console.log(salesReport)
  res.render('admin/sales-report', { admin: true, salesReport })
})


router.get('/banners', (req, res) => {
  res.render("admin/add-banner",{admin: true})
})

router.post('/add-banner', (req, res) => {
  console.log("banner working")
  console.log(req.body);
  let image1 = req.files.banner1
  let image2 = req.files.banner2
  let image3 = req.files.banner3
  image1.mv('./public/banner-images/' + "banner1" + '.jpg')

  image2.mv('./public/banner-images/' + "banner2" + '.jpg')

  image3.mv('./public/banner-images/' + "banner3" + '.jpg')
})





module.exports = router;
