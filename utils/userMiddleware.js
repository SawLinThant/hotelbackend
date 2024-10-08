const jwt = require("jsonwebtoken");
const {jwtSecretKey} = require("./config");

const authenticateUserToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        const accessToken = authHeader && authHeader.split(' ')[1]
        if (!accessToken) {
            return res.status(403).json({message: "you need user token to access this resource"})
        } else {
            const validatedUser = jwt.verify(accessToken, jwtSecretKey);
            req.user_id = validatedUser.user_id;
            req.role = validatedUser.role;
            if (validatedUser) {
                return next();
            }
        }
    } catch (err) {
        console.log(err)
        return res.status(401).json(err);
    }
};

module.exports = {authenticateUserToken};
