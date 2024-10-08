const jwt = require("jsonwebtoken");
const {jwtSecretKey, jwtExpTime, graphqlApi} = require("./config");

const createHasuraJWT = (userId, role) => {
    return jwt.sign({
        "https://hasura.io/jwt/claims": {
            "x-hasura-default-role": role,
            "x-hasura-allowed-roles": [role],
            "x-hasura-user-id": userId,
        },
        user_id: userId,
        role
    }, jwtSecretKey, {expiresIn: jwtExpTime});
}




const fetchGraphqlApi = async (query, variables) => {
    try {
        const response = await fetch("https://amused-salmon-26.hasura.app/v1/graphql", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "x-hasura-admin-secret": "qThgBpUb0uF4l6qk1LGrnniak0ayiGoU1yXA4g0HRf8fTlOIP7I8NbCzAl7ibT4X"
            },
            body: JSON.stringify({
                query,
                variables
            }),
        })
        return await response.json()
    } catch (e) {
        console.log(e)
    }
}

function generateTransactionNumber(length = 20) {
    if (length > 20) length = 20; // Ensure the length does not exceed 20
    let transactionNumber = "";
    const digits = "0123456789";
    for (let i = 0; i < length; i++) {
        transactionNumber += digits[Math.floor(Math.random() * digits.length)];
    }
    return transactionNumber;
}



module.exports = {
    createHasuraJWT,
    fetchGraphqlApi,
    generateTransactionNumber
}
