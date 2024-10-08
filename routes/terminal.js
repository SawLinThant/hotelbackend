var express = require('express');
const knex = require("../utils/knex");
const {compare} = require("bcrypt");
const bcrypt = require("bcrypt");
const {createHasuraJWT} = require("../utils/helper");
const {authenticateUserToken} = require("../utils/userMiddleware");
var router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const {terminal_number, password} = req.body.input;
        if (terminal_number && password) {
            const existingTerminal = await knex('terminals').where('terminal_number', terminal_number)
            if (existingTerminal.length === 0) {
                return res.status(400).json({message: "terminal_number doesn't exists"})
            } else {
                if (existingTerminal[0].disabled === true) {
                    return res.status(401).json({message: "account is disable"});
                } else {
                    const match = await compare(password, existingTerminal[0].password)
                    if (!match) {
                        return res.status(401).json({message: "invalid password"});
                    } else {
                        const token = createHasuraJWT(existingTerminal[0].id, 'terminal')
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

router.post("/register", async (req, res) => {
    try {
        const {facility_id, terminal_number, password} = req.body.input;
        if (facility_id && terminal_number && password) {
            const existingTerminal = await knex('terminals').where('terminal_number', terminal_number)
            if (existingTerminal.length !== 0) {
                return res.status(401).json({message: "terminal_number already exists"})
            } else {
                const hashedPassword = await bcrypt.hash(password, 10)
                const createdTerminal = await knex('terminals').insert({
                    facility_id,
                    terminal_number,
                    password: hashedPassword,
                }).returning('id')
                return res.status(201).json({
                    message: "terminal register success",
                    terminal_id: createdTerminal[0].id
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
        const {terminal_id, oldPassword, newPassword, confirmNewPassword} = req.body.input;

        if (oldPassword && newPassword && confirmNewPassword) {
            if (newPassword !== confirmNewPassword) {
                return res.status(401).json({message: "confirm password doesn't match"})
            } else {
                const exisingUser = await knex('terminals').where('id', terminal_id)
                const match = await compare(oldPassword, exisingUser[0].password)
                if (!match) {
                    return res.status(401).json({message: "invalid old password"});
                } else {
                    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
                    await knex('terminals').update({
                        password: hashedNewPassword,
                    }).where('id', terminal_id)
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
