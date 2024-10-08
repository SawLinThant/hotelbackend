var express = require('express');
const knex = require("../utils/knex");
const {compare} = require("bcrypt");
const bcrypt = require("bcrypt");
const {createHasuraJWT} = require("../utils/helper");
const {authenticateUserToken} = require("../utils/userMiddleware");
var router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const {username, password} = req.body.input;
        if (username && password) {
            const existingStaff = await knex('staffs').where('username', username)
            if (existingStaff.length === 0) {
                return res.status(400).json({message: "username doesn't exists"})
            } else {
                if (existingStaff[0].disabled === true) {
                    return res.status(401).json({message: "account is disabled"});
                } else {
                    const match = await compare(password, existingStaff[0].password)
                    if (!match) {
                        return res.status(401).json({message: "invalid password"});
                    } else {
                        const token = createHasuraJWT(existingStaff[0].id, existingStaff[0].role)
                        const hotel_group = existingStaff[0].hotel_group;
                        return res.status(200).json({
                            token,
                            message: "staff login success",
                            hotel_group: hotel_group
                        })
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

router.post("/register", async (req, res) => {
    try {
        const {name, username, password, role} = req.body.input;
        if (name && username && password && role) {
            const existingStaff = await knex('staffs').where('username', username)
            if (existingStaff.length !== 0) {
                return res.status(401).json({message: "account already exists"})
            } else {
                const hashedPassword = await bcrypt.hash(password, 10)
                const createdStaff = await knex('staffs').insert({
                    name,
                    username,
                    role,
                    password: hashedPassword,
                }).returning('id')
                return res.status(201).json({
                    message: "staff register success",
                    staff_id: createdStaff[0].id
                })
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
                const exisingUser = await knex('staffs').where('id', user_id)
                const match = await compare(oldPassword, exisingUser[0].password)
                if (!match) {
                    return res.status(401).json({message: "invalid old password"});
                } else {
                    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
                    await knex('staffs').update({
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
