let db = require('../config/connection')
let collection = require('../config/collections');
const { response } = require('../app');
let objectId = require('mongodb').ObjectId
module.exports = {

    addProduct: (product, callback) => {
        console.log(product);
        db.get().collection('product').insertOne(product).then((data) => {
            console.log(data)
            callback(data.insertedId);
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(proId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {
                    name: proDetails.name,
                    description: proDetails.description,
                    price: proDetails.price,
                    category: proDetails.category,
                    stock: proDetails.stock,
                    subcategory: proDetails.subcategory
                }
            }).then((response) => {
                resolve();
            })
        })
    },

    addCategory: (category) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne({ maincategory: category }).then((response) => {
                console.log(response);
            })
        })
    },

    getMainCategory: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then((response) => {
                console.log(response);
                resolve(response)
            })
        })
    },

    addSubCategory: (scategory) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.SUBCATEGORY_COLLECTION).insertOne({subcategory:scategory}).then((response) => {
                console.log(response)
                resolve(response);
            })
        })
    },

    getSubCategory:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.SUBCATEGORY_COLLECTION).find().toArray().then((response)=>{
                resolve(response);
            })
        })
    }
}