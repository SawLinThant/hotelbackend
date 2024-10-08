var express = require('express');
const knex = require("../utils/knex");
const {compare} = require("bcrypt");
const bcrypt = require("bcrypt");
const {generateTransactionNumber} = require("../utils/helper");
const {authenticateUserToken} = require("../utils/userMiddleware");
var router = express.Router();


const regex = /^\d{4}$/;

router.post("/register", authenticateUserToken, async (req, res) => {
    try {
        const {card_number, card_password, customer_id} = req.body.input;
        if (card_number && card_password && customer_id) {
            const existingCard = await knex('cards').where('card_number', card_number)
            if (existingCard.length === 0) {
                return res.status(401).json({message: "card_number doesn't exists"})
            } else if (existingCard[0].customer_id !== null) {
                return res.status(401).json({message: "card is already registered"})
            } else if (regex.test(card_password) === false) {
                return res.status(401).json({message: "card password must be 4 number"})
            } else {

                const hashedPassword = await bcrypt.hash(card_password, 10)
                const updatedCard = await knex('cards').update({
                    card_number,
                    card_password: hashedPassword,
                    customer_id,
                    disabled: false
                }).where('card_number', card_number).returning('id')
                return res.status(201).json({
                    message: "card register success",
                    card_id: updatedCard[0].id
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


router.post("/cashin", authenticateUserToken, async (req, res) => {
    try {
        const user_id = req.user_id
        const {card_number, card_password, amount} = req.body.input;
        if (card_number && card_password && amount) {
            const existingCard = await knex('cards').where('card_number', card_number)
            if (existingCard.length === 0) {
                return res.status(400).json({message: "Card number is invalid"})
            } else {
                if (existingCard[0].disabled === true) {
                    return res.status(401).json({message: "Card is disable"});
                } else {
                    const match = await compare(card_password, existingCard[0].card_password)
                    if (!match) {
                        return res.status(401).json({message: "Pin number is invalid"});
                    } else {
                        await knex('cards').update({
                            balance: Number(existingCard[0].balance) + Number(amount)
                        }).where('card_number', card_number)
                        await knex('card_transactions').insert({
                            card_id: existingCard[0].id,
                            card_transaction_type: "cash in",
                            terminal_id: user_id,
                            amount,
                            transaction_number: generateTransactionNumber(),
                        })
                        return res.status(201).json({message: "card cashin success"})
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


router.post("/purchase-service", authenticateUserToken, async (req, res) => {
    try {
        const user_id = req.user_id
        const {card_number, card_password, selected_services} = req.body.input;
        if (card_number && card_password && selected_services) {
            const existingCard = await knex('cards').where('card_number', card_number)
            if (existingCard.length === 0) {
                return res.status(400).json({message: "Card number is invalid"})
            } else {
                if (existingCard[0].disabled === true) {
                    return res.status(401).json({message: "Card is disable"});
                } else {
                    const match = await compare(card_password, existingCard[0].card_password)
                    if (!match) {
                        return res.status(401).json({message: "Pin number is invalid"});
                    } else {
                        const totalAmount = selected_services.reduce((total, item) => total + item.service_price, 0)

                        if (Number(existingCard[0].balance) < totalAmount) {
                            return res.status(401).json({message: "Not enough balance"});
                        } else {

                            await knex('cards').update({
                                balance: Number(existingCard[0].balance) - Number(totalAmount)
                            }).where('card_number', card_number)

                            const createdCardTrax = await knex('card_transactions').insert({
                                card_id: existingCard[0].id,
                                card_transaction_type: "purchase",
                                terminal_id: user_id,
                                amount: totalAmount,
                                transaction_number: generateTransactionNumber(),
                            }).returning('id')

                            const purchasedServices = selected_services.map((item) => ({
                                ...item,
                                card_transaction_id: createdCardTrax[0].id
                            }))

                            await knex('purchased_services').insert(purchasedServices)

                            return res.status(201).json({message: "service purchases success"})
                        }
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


module.exports = router;
