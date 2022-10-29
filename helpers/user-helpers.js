let db = require('../config/connection')
let collection = require('../config/collections')
let bcrypt = require('bcrypt');
const config = require('../config/otpconfig');
const { response } = require('../app');
const client = require('twilio')(config.accountSID, config.authToken)
let objectId = require('mongodb').ObjectId

const Razorpay = require('razorpay');
const { resolve } = require('path');
const { log } = require('console');
var instance = new Razorpay({
    key_id: 'rzp_test_vOWB4Hpqe9fSat',
    key_secret: 'FzmPqfwFMBihPYceyGhefE3s'
});



module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(userData.insertedId)
            })
        })
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                if (user.blocked) {
                    response.blocked = true
                    resolve(response)
                } else {
                    bcrypt.compare(userData.Password, user.Password).then((status) => {
                        if (status) {
                            console.log("login success");
                            console.log(status)
                            response.user = user
                            response.status = true
                            resolve(response)
                        } else {
                            console.log('login failed');
                            resolve({ status: false })
                        }
                    })
                }
            } else {
                console.log('login failed');
                resolve({ status: false });
            }
        })
    },

    sendOtp: async (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            console.log("started to send");
            console.log(user);
            resolve(response)
            phonenumber = "+91" + user.phonenumber
            if (user.phonenumber = null) {
                req.session.logginErr = true
                console.log("phone number not found");
            } else {
                client
                    .verify
                    .services(config.serviceID)
                    .verifications
                    .create({
                        to: phonenumber,
                        channel: "sms",
                    })
                    .then((data) => {
                        console.log('otp Sended successfully');
                    });
            }
        })
    },

    verifyotp: (userData, otpval) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            let OTP = "";
            otpval.forEach(val => {
                OTP += val;
            })
            console.log("mf")
            console.log(OTP)

            let phonenumber = "+91" + user.phonenumber
            var otpApproved;
            console.log(phonenumber)
            await client
                .verify
                .services(config.serviceID)
                .verificationChecks
                .create({
                    to: phonenumber,
                    code: OTP
                })
                .then((data) => {
                    console.log(typeof (data.status))
                    if (data.status == "approved") {
                        otpApproved = true;
                        console.log("Otp verified")
                    } else {
                        otpApproved = false;
                        console.log("OTP error");
                    }
                })
            resolve(otpApproved)
        })
    },

    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product =>
                    product.item == proId
                )
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                        {
                            $inc: { "products.$.quantity": 1 }
                        }
                    ).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId }, { $push: { products: proObj } }).then((response) => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([{
                $match: { user: objectId(userId) }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    item: '$products.item',
                    quantity: '$products.quantity'
                }
            },
            {
                $lookup: {
                    from: collection.PRODUCT_COLLECTION,
                    localField: 'item',
                    foreignField: '_id',
                    as: 'product'
                }

            },
            {
                $project: {
                    item: 1,
                    quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                }
            }

            ]).toArray()
            //console.log(cartItems[0].products)
            resolve(cartItems);
        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    changeProductQuantity: (details) => {
        console.log("change product quantity started")
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                    {
                        $inc: { "products.$.quantity": details.count }
                    }
                ).then((response) => {
                    resolve(true)
                })
            }
        })
    },

    removeProduct: (prodData) => {
        return new Promise((res, rej) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(prodData.cartId) },
                {
                    $pull: { products: { item: objectId(prodData.proId) } }
                }


            ).then((response) => {
                res(response)
            })
        })
    },



    getTotalAmount: (userId) => {
        console.log('hello')
        console.log(userId)
        return new Promise(async (resolve, reject) => {
            prodata = await db.get().collection(collection.CART_COLLECTION).aggregate([{
                $match: { user: objectId(userId) }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    item: '$products.item',
                    quantity: '$products.quantity'
                }
            },
            {
                $lookup: {
                    from: collection.PRODUCT_COLLECTION,
                    localField: 'item',
                    foreignField: '_id',
                    as: 'product'
                }

            },
            {
                $project: {
                    item: 1,
                    quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                }
            },

            ]).toArray()
            console.log("black adam")
            console.log(prodata)
            let total = 0;
            let grandTotal = 0
            prodata.forEach((x) => {
                // console.log(x.quantity)
                // console.log(x.product.price)  
                total = (x.quantity) * (x.product.price)
                console.log(total)
                grandTotal += total
            })


            resolve(grandTotal)
        })
    },

    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total)
            let date = new Date()
            //let status=order.paymentmethod==='cod'?'placed':'pending'
            let status = order.paymentMethod === 'cod' ? 'pending' : 'placed'

            let orderObj = {
                deliveryDetails: {
                    name: order.name,
                    address: order.address,
                    pincode: order.pincode,
                    country: order.country,
                    state: order.state,
                    city: order.city,
                    mobile: order.phonenumber,
                    email: order.email
                },
                userId: objectId(order.userId),
                paymentMethod: order.paymentmethod,
                products: products,
                totalamount: total,
                status: status,
                date: new Date(),
                month: date.getMonth()
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve(response.insertedId)
                console.log(response.insertedId)
                console.log("order collection created")
            })
        })
    },

    getCartProductsList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },

    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId);
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).toArray()
            resolve(orders)
        })
    },

    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            console.log('ordered items')
            console.log(orderItems)
            resolve(orderItems)
        })
    },

    cancelOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: {
                    status: 'cancelled'
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },

    checkEmail: (emailId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ email: emailId }).then((response) => {
                resolve(response)
                console.log('signup response')
                console.log(response)
            })
        })
    },

    generateRazorpay: (orderId, total) => {
        console.log("jett")
        console.log(orderId)
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("razorpee")
                    console.log(order);
                    resolve(order)
                }
            })
        })
    },

    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'FzmPqfwFMBihPYceyGhefE3s')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            console.log(hmac);
            console.log(details['payment[rarorpay_payment_id]'])
            if (hmac == details['payment[razorpay_signature]']) {
                console.log("matched")
                resolve()
            } else {
                console.log("not matched")
                reject()
            }
        })
    },

    changePaymentStatus: (orderId, currentStatus) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: {
                    status: currentStatus
                }
            }).then(() => {
                resolve()
            })
        })
    },

    editProfile: (userId, userDetails) => {
        console.log('userDetails here we go')
        console.log(userId)
        console.log('whee')
        console.log(userDetails)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    username: userDetails.username,
                    email: userDetails.email,
                    phonenumber: userDetails.phonenumber,
                    address: userDetails.address,
                    city: userDetails.city,
                    state: userDetails.state,
                    pincode: userDetails.pincode,
                    birthday: userDetails.birthday,
                    gender: userDetails.gender
                }
            }).then((response) => {
                resolve(response);
            })
        })
    },

    userDetails: (userId) => {
        console.log(userId)
        return new Promise(async (resolve, reject) => {
            let userDetails = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            console.log("mind hrere")
            console.log(userDetails)
            resolve(userDetails)
        })

    },

    addToWishlist: (proId, userId) => {
        let proObj = {
            item: objectId(proId)
        }
        return new Promise(async (resolve, reject) => {
            console.log("wishlist working")
            let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (userWishlist) {
                let proExist = userWishlist.products.findIndex(product =>
                    product.item == proId
                )
                if (proExist != -1) {
                    console.log("suii -1")
                } else {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId }, { $push: { products: proObj } }).then((response) => {
                        resolve(response)
                    })
                }
            } else {
                let wishlistObj = {
                    user: objectId(userId),
                    products: [proObj],
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishlistObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },

    getWishlist: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([{
                $match: { user: objectId(userId) }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    item: '$products.item'
                }
            },
            {
                $lookup: {
                    from: collection.PRODUCT_COLLECTION,
                    localField: 'item',
                    foreignField: '_id',
                    as: 'product'
                }

            },
            {
                $project: {
                    item: 1,
                    product: { $arrayElemAt: ['$product', 0] }
                }
            }

            ]).toArray()
            //console.log(cartItems[0].products)
            resolve(wishItems);
        })
    },

    removeWishlist: (userId, proId) => {
        console.log("remove wishlist working")
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) }, { $pull: { products: { item: objectId(proId) } } }).then((response) => {
                resolve(response)
                console.log(response)
            })
        })
    },

    getUserOrdersCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let ordersCount
            let userOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).toArray()
            if (userOrders) {
                ordersCount = userOrders.length
            }
            resolve(ordersCount)
        })
    },

    getWishlistCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlistCount;
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).find({ user: objectId(userId) }).toArray()
            console.log('big problem')
            console.log(wishlist)
            if (wishlist.length > 0) {
                wishlistCount = wishlist[0].products.length
            } else {
                wishlistCount = 0;
            }
            resolve(wishlistCount);
        })
    },

    checkCoupen: (code) => {
        return new Promise((resolve, reject) => {
            let coupen = db.get().collection(collection.COUPEN_COLLECTION).findOne({ code: code })
            if (coupen) {
                resolve(coupen);
            } else {
                reject()
            }
        })
    },

    applyCoupen: (code) => {
        return new Promise(async (resolve, reject) => {
            let coupen = await db.get().collection(collection.COUPEN_COLLECTION).find({ code: code }).toArray()
            resolve(coupen);
        })
    },

    search: (data) => {
        return new Promise(async (resolve, reject) => {
            try {
                let products;
                db.get().collection(collection.PRODUCT_COLLECTION).createIndex({ name: "text", category: "text" }).then((response) => {
                    new Promise(async (resolve, reject) => {
                        products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ $text: { $search: data } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } }).toArray()
                        resolve(products)
                    }).then((products) => {
                        if (products == "") {
                            reject()
                        }
                        resolve(products)
                    })
                })
            } catch {
                response.status(400).send({ sucess: false })
                reject();
            }
        })
    },

    getMensOnly: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: "Mens" }).toArray();
            resolve(products)

        })
    },

    getMomensOnly: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: "Womens" }).toArray();
            resolve(products)
        })
    },

    getKidsOnly: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: "Kids" }).toArray()
            resolve(products)
        })
    },

    addAddress1: (userId, address1) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).insertOne({ userId, address1 }).then((response) => {
                resolve(response);
            }).catch((err) => {
                reject(err)
            })
        })
    },

    addAddress2: (userId, address2) => {
        return new Promise(async (resolve, reject) => {
            let address1 = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ userId: userId })
            console.log(address1);
            if (address1) {
                await db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ userId: userId }, { $set: { address2: address2 } }).then((response) => {
                    resolve(response);
                    console.log(userId);
                    console.log("address one exits")
                    console.log(response);
                })
            }
        })
    },

    getAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ userId: userId })
            resolve(address);
        })
    },

    updateAddress1: (userId, address1) => {
        return new Promise(async (resolve, reject) => {
            let addUpdate = db.get().collection(collection.ADDRESS_COLLECTION).update({ userId: userId },
                {
                    $set: {
                        "address1.address": address1.address,
                        "address1.pincode": address1.pincode,
                        "address1.state": address1.state,
                        "address1.district": address1.district,
                        "address1.town": address1.town,
                        "address1.default": address1.default
                    }
                })
            resolve(addUpdate);
        })
    },

    updateAddress2: (userId, address2) => {
        return new Promise(async (resolve, reject) => {
            let addUpdate = db.get().collection(collection.ADDRESS_COLLECTION).update({ userId: userId },
                {
                    $set: {
                        "address2.address": address2.address,
                        "address2.pincode": address2.pincode,
                        "address2.state": address2.state,
                        "address2.district": address2.district,
                        "address2.town": address2.town,
                        "address2.default": address2.default
                    }
                })
            resolve(addUpdate);
        })
    },

    addressDefault1: (userId) => {
        return new Promise(async (resolve, reject) => {
            let default1 = await db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ userId: userId },
                {
                    $set:
                    {
                        "address1.default": true,
                        "address2.default": false,
                    }
                })
            resolve(default1);
        })
    },

    addressDefault2: (userId) => {
        return new Promise(async (resolve, reject) => {
            let default2 = await db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ userId: userId },
                {
                    $set:
                    {
                        "address2.default": true,
                        "address1.default": false,

                    }
                })
            resolve(default2);
        })
    },

    getDefaultAddress1:(userId)=>{
        return new Promise(async(resolve,reject)=>{
           let address1=await db.get().collection(collection.ADDRESS_COLLECTION).findOne({"address1.default":true});
           resolve(address1)
        })
    },

    getDefaultAddress2:()=>{
        return new Promise(async(resolve,reject)=>{
            let address2=await db.get().collection(collection.ADDRESS_COLLECTION).findOne({"address2.default":true});
            resolve(address2)
        })
    },

    changePassword:(userId,newPassword)=>{
        return new Promise(async(resolve,reject)=>{
            let suiiPassword = await bcrypt.hash(newPassword, 10)
            console.log("hash password");
            console.log(suiiPassword);
            await db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{$set:{Password:suiiPassword}}).then((response)=>{
                console.log(response)
                resolve(response);
            })
        })
    },
    filterPrice:(miniValue,maxValue)=>{
        console.log("suii values")
        console.log(miniValue,maxValue);
        return new Promise(async(resolve,reject)=>{
         let GTminiValue = await db.get().collection(collection.PRODUCT_COLLECTION).find({},{price:{$gt:'1500',$lt:'20000'}}).toArray()
         resolve(GTminiValue)
         console.log("fiiiiiet")
         console.log(GTminiValue);
        })
    }
}