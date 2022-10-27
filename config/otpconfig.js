let dotenv = require('dotenv')
dotenv.config({path:"config.env"})

module.exports = {
    serviceID:process.env.serviceID,
    accountSID:process.env.accountSID,
    authToken:process.env.authToken

}