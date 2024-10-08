var express = require('express');
const knex = require("../utils/knex");
const {compare} = require("bcrypt");
const bcrypt = require("bcrypt");
const {createHasuraJWT} = require("../utils/helper");
const {authenticateUserToken} = require("../utils/userMiddleware");
var router = express.Router();

router.post("/signin", async (req, res) => {
    try {
        const {phone, password} = req.body.input;
        if (phone && password) {
            const existingUser = await knex('customers').where('phone', phone)
            if (existingUser.length === 0) {
                return res.status(400).json({message: "email doesn't exists"})
            } else {
                if (existingUser[0].disabled === true) {
                    return res.status(401).json({message: "account is disabled"});
                } else {
                    const match = await compare(password, existingUser[0].password)
                    if (!match) {
                        return res.status(401).json({message: "invalid password"});
                    } else {
                        const token = createHasuraJWT(existingUser[0].id, existingUser[0].role)
                        return res.status(200).json({token})
                    }
                }
            }
        } else {
            return res.status(400).json({message: "missing required fields"})
        }
    } catch (e) {
        console.log(e)
        return res.status(500).json(e)
    }
})

router.post("/signup", async (req, res) => {
    try {
        const {name, email, password, role} = req.body.input;
        if (name && email && password && role) {
            const existingUser = await knex('admins').where('email', email)
            if (existingUser.length !== 0) {
                return res.status(401).json({message: "account already exists"})
            } else {
                const hashedPassword = await bcrypt.hash(password, 10)
                const createdUser = await knex('admins').insert({
                    name,
                    email,
                    role,
                    password: hashedPassword,
                }).returning('id')
                const token = createHasuraJWT(createdUser[0].id, role)
                return res.status(201).json({token})
            }
        } else {
            return res.status(400).json({message: "missing required fields"})
        }
    } catch (e) {
        console.log(e)
        return res.status(500).json(e)
    }
})

router.post("/update-password", authenticateUserToken, async (req, res) => {
    try {
        const {oldPassword, newPassword, confirmNewPassword} = req.body.input;
        const user_id = req.user_id

        if (oldPassword && newPassword && confirmNewPassword) {
            if (newPassword !== confirmNewPassword) {
                return res.status(401).json({message: "confirm password doesn't match"})
            } else {
                const exisingUser = await knex('admins').where('id', user_id)
                const match = await compare(oldPassword, exisingUser[0].password)
                if (!match) {
                    return res.status(401).json({message: "invalid old password"});
                } else {
                    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
                    await knex('admins').update({
                        password: hashedNewPassword,
                    }).where('id', user_id)
                    return res.status(200).json({message: "password updated successfully"})
                }
            }
        } else {
            return res.status(400).json({message: "missing required fields"})
        }
    } catch (e) {
        console.log(e)
        return res.status(500).json(e)
    }
})


module.exports = router;
