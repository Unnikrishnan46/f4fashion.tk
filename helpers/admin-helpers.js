var db = require('../config/connection')
var collection = require('../config/collections')
const { Db } = require('mongodb')
const objectId = require('mongodb').ObjectId
const { ADMIN_COLLECTION } = require('../config/collections')
const { response } = require('../app')

module.exports = {

    doAdminLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let adminLoginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ username: adminData.username, password: adminData.password })
            if (admin) {
                console.log("login success");
                response.admin = admin
                response.status = true
                resolve(response)
            }
            else {
                console.log('login failed');
                resolve({ status: false })

            }
        })
    },

    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let allUserDetails = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            //console.log(allUserDetails);
            resolve(allUserDetails);
        })
    },

    blockUser: (userId) => {
        console.log(userId)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $set: { blocked: true } }).then((response) => {
                resolve(response)
            })
        })
    },
    unblockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $set: { blocked: false } }).then((response) => {
                resolve(response)
            })
        })
    },
    verifyUserBlocked: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).find({ $and: [{ _id: objectId(userId) }, { blocked: true }] }).then((response) => {
                if (userBlocked) {
                    response.userBlocked = true;
                }
                resolve(response);
            })
        })
    },

    //January
    getOrderMonthJan: () => {
        return new Promise((resolve, reject) => {
            let jan = db.get().collection(collection.ORDER_COLLECTION).find({ month: 0 }).count()
            resolve(jan);
        })
    },
    //February
    getOrderMonthFeb: () => {
        return new Promise((resolve, reject) => {
            let feb = db.get().collection(collection.ORDER_COLLECTION).find({ month: 1 }).count()
            resolve(feb);
        })
    },
    //March
    getOrderMonthMarch: () => {
        return new Promise((resolve, reject) => {
            let march = db.get().collection(collection.ORDER_COLLECTION).find({ month: 2 }).count()
            resolve(march);
        })
    },
    //April
    getOrderMonthApril: () => {
        return new Promise((resolve, reject) => {
            let april = db.get().collection(collection.ORDER_COLLECTION).find({ month: 3 }).count()
            resolve(april);
        })
    },
    //May
    getOrderMonthMay: () => {
        return new Promise((resolve, reject) => {
            let may = db.get().collection(collection.ORDER_COLLECTION).find({ month: 4 }).count()
            resolve(may);
        })
    },
    //June
    getOrderMonthJune: () => {
        return new Promise((resolve, reject) => {
            let june = db.get().collection(collection.ORDER_COLLECTION).find({ month: 5 }).count()
            resolve(june);
        })
    },
    //July
    getOrderMonthJuly: () => {
        return new Promise((resolve, reject) => {
            let july = db.get().collection(collection.ORDER_COLLECTION).find({ month: 6 }).count()
            resolve(july);
        })
    },
    //August
    getOrderMonthAug: () => {
        return new Promise((resolve, reject) => {
            let aug = db.get().collection(collection.ORDER_COLLECTION).find({ month: 7 }).count()
            resolve(aug);
        })
    },
    //September
    getOrderMonthSept: () => {
        return new Promise((resolve, reject) => {
            let sept = db.get().collection(collection.ORDER_COLLECTION).find({ month: 8 }).count()
            resolve(sept);
        })
    },
    //October
    getOrderMonthOct: () => {
        return new Promise((resolve, reject) => {
            let oct = db.get().collection(collection.ORDER_COLLECTION).find({ month: 9 }).count()
            resolve(oct);
        })
    },
    //November
    getOrderMonthNov: () => {
        return new Promise((resolve, reject) => {
            let nov = db.get().collection(collection.ORDER_COLLECTION).find({ month: 10 }).count()
            resolve(nov);
        })
    },
    //Desember
    getOrderMonthDes: () => {
        return new Promise((resolve, reject) => {
            let des = db.get().collection(collection.ORDER_COLLECTION).find({ month: 11 }).count()
            resolve(des);
        })
    },

    //Total Orders
    getTotalOrders: () => {
        return new Promise((resolve, reject) => {
            let totalOrders = db.get().collection(collection.ORDER_COLLECTION).find().count()
            resolve(totalOrders);
        })
    },

    //Total Sales Amount
    getTotalSalesAmount: () => {
        return new Promise(async(resolve, reject) => {
            let totalAmount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([{ $group: { _id: null, totalSum: { $sum: "$totalamount" } } }]).toArray()
            console.log('ccccc',totalAmount);
            resolve(totalAmount)
        })
    },

    //Total Products
    getTotalProductsCount: () => {
        return new Promise((resolve, reject) => {
            let totalProducts = db.get().collection(collection.PRODUCT_COLLECTION).find().count()
            resolve(totalProducts)
        })
    },

    //All Orders
    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let allOrders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(allOrders);
        })
    },

    statusPacking: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, { $set: { status: 'Packing' } }).then(() => {
                resolve()
            })
        })
    },

    statusShipped: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, { $set: { status: 'Shipped' } }).then(() => {
                resolve()
            })
        })
    },

    statusDelivered: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, { $set: { status: 'Delivered' } }).then(() => {
                resolve()
            })
        })
    },

    addCoupen: (coupenData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPEN_COLLECTION).insertOne(coupenData).then((response) => {
                resolve()
                console.log(response);
            })
        })
    },

    getCoupenDetails: () => {
        return new Promise(async (resolve, reject) => {
            let coupenDetails = await db.get().collection(collection.COUPEN_COLLECTION).find().toArray()
            resolve(coupenDetails);
        })
    },

    deleteCoupen: (coupenId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPEN_COLLECTION).deleteOne({ _id: objectId(coupenId) }).then((response) => {
                resolve()
                console.log(response)
            })
        })
    },

    salesReport: () => {
        return new Promise(async (resolve, reject) => {
            let salesReport = await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
                $lookup: {
                    from: collection.USER_COLLECTION,
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            {
                $lookup: {
                    from: collection.PRODUCT_COLLECTION,
                    localField: 'products.item',
                    foreignField: '_id',
                    as: 'product'
                }
            }
            ]).toArray()
            resolve(salesReport);
        })
    },

    getProductReport: () => {
        currentYear = new Date().getFullYear();
        return new Promise(async (resolve, reject) => {
            const ProductReport = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $unwind: '$products'
                },
                {
                    $project:{
                        item:"$products.item",
                        quantity:"$products.quantity"
                    }
                },
                {
                    $group:{
                        _id:"$item",
                        totalSaledProduct:{$sum:"$quantity"}
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:"_id",
                        foreignField:"_id",
                        as:"product"
                    }
                },
                {
                    $unwind:"$product"
                },
                {
                    $project:{
                        name:"$product.name",
                        totalSaledProduct:1,
                        _id:1
                    }
                }
            ]).toArray()
            console.log(ProductReport);
            resolve(ProductReport);
        })
    }
}