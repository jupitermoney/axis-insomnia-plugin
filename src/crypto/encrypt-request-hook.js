module.exports = function(context) {
    const constants = require("../constants")

    if (context.request.getEnvironmentVariable(constants.environmentKeys.crypto.enableRequestEncryption) !== true) return;

    const key = context.request.getEnvironmentVariable(constants.environmentKeys.crypto.aesKey)
    if (key === undefined) {
        console.log("No encryption key env set so skipping request encryption")
        return
    }

    if (context.request.getBody().text === undefined) return;
    if (context.request.getHeader("Content-Type") !== "application/json") return;

    const request = JSON.parse(context.request.getBody().text)
    console.log("Processing request for encryption: " + JSON.stringify(request))
    const unwrappedRequestKey = Object.keys(request)[0]
    let requestBodyKey = Object.keys(request[unwrappedRequestKey]).find(field => field.endsWith("RequestBody"))

    if (requestBodyKey !== undefined) {
        console.log("Found encryptable field: " + requestBodyKey + " with value " + JSON.stringify(request[unwrappedRequestKey][requestBodyKey]))

        const AxisCrypto = require("./axis-crypto")
        let crypto = new AxisCrypto(key)
        let requestBodyEncrypted = crypto.encrypt(JSON.stringify(request[unwrappedRequestKey][requestBodyKey]))
        delete request[unwrappedRequestKey][requestBodyKey];
        request[unwrappedRequestKey][requestBodyKey + "Encrypted"] = requestBodyEncrypted

        console.log("New request: ", request)
        let body = context.request.getBody()
        body.text = JSON.stringify(request)
        context.request.setBody(body)
    } else {
        console.log("Encryptable field not found")
    }
}
