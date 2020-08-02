const guidHelper = require('helpers/guidHelper');
const gatewayHelper = require('helpers/gatewayHelper.js');

const mysql = require('serverless-mysql')({
    config: {
        host     : process.env.ENDPOINT,
        database : process.env.DATABASE,
        user     : process.env.USERNAME,
        password : process.env.PASSWORD
    }
});
  
// Main handler function
exports.handler = async (event, context) => {
    const eventBody = JSON.parse(event.body);
    
    if (
        !eventBody.hasOwnProperty('email')
    ) {
        return gatewayHelper.response(400);
    }

    const email = eventBody.email;
    const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegexp.test(email)) {
        return gatewayHelper.response(400, null, '{"result":"error","message":"Invalid e-mail address."}');
    }
    
    let results = null;

    const userInfo = {
        email: email,
        accessToken: guidHelper.guid(32)
    };
    
    try {
        results = await mysql.query(
            "INSERT INTO users (email) VALUES ('" + email + "');"
        );

        if (results.insertId) {
            let tokenResult = await mysql.query(
                "INSERT INTO user_tokens (user_id, access_token) VALUES (" + results.insertId + ", '" + userInfo.accessToken + "');"
            );
        }
      
        await mysql.end();
    } catch (e) {
        // TODO: Consolidate & Unify MySQL + error handling - possibly better done async
        console.error("Unable to insert user: " + email);

        let errorCode = 500;

        let errorResponse = {
            "result": "error",
            "error": "Unknown error occurred."
        };
        
        if (e.code === 'ER_DUP_ENTRY') {
            errorCode = 409; // Conflict
            errorResponse.error = "E-mail already exists.";
        }
        
        return gatewayHelper.response(errorCode, null, JSON.stringify(errorResponse));
    }  

    return gatewayHelper.response(200, null, JSON.stringify(userInfo));
}