const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db")

const router = new express.Router();


router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(`SELECT id, comp_code FROM invoices`);
        return res.json({ invoices: results.rows});
    } catch (e){
        return next(e);
    }
})

router.get("/:id", async (req, res, next) => {
    try{
        const {id} = req.params;
        const results = await db.query(`SELECT * FROM invoices JOIN companies ON invoices.comp_code = companies.code WHERE id = $1`, [id]);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404)
        }

        const data = results.rows[0]

        const invoice = {
            invoice: {
                id: data.id,
                amt: data.amt,
                add_date: data.add_date,
                paid_date: data.paid_date,
                paid: data.paid,
                company: {
                  code: data.code,
                  name: data.name,
                  description: data.description  
                }

            }
        }
        return res.send(invoice)
    }
    catch(e){
        return next(e);
    }
})

router.post("/", async (req, res, next) => {
    try{
        const { comp_code, amt } = req.body;
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);
        return res.status(201).json({invoice: results.rows[0]})
    } 
    catch(e){
        return next(e)
    }
})

//instructions say to do a Put request but i think it's a patch since we are only updating part of the data
router.patch("/:id", async (req, res, next) => {
    try{
        const {id} = req.params;
        const {amt} = req.body;
        const results = await db.query(`UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, id]);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't update invoice with id of ${id}`, 404)
        }
        return res.send({ invoice: results.rows[0]})
    } catch (e){
        return next(e)
    }
})

router.delete("/:id", async (req, res, next) => {
    try{
        const {id} = req.params
        const results = await db.query(`DELETE FROM invoices WHERE id = $1 RETURNING id`, [id]);
        if(results.rows.length === 0){
            throw new ExpressError(`Can't delete invoice with id of ${id}`)
        }
        return res.send({ status: "deleted"})
    } catch (e) {
        return next(e)
    }
})
module.exports = router;