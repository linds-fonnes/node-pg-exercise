const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");
const slugify = require("slugify")

const router = new express.Router();

router.get("/", async(req,res,next) => {
    try{
        const results = await db.query(`SELECT code, name FROM companies`);
        return res.json({companies: results.rows})
    } catch (e){
        return next(e)
    }
})

router.get("/:code", async(req, res, next) => {
    try{
        const {code} = req.params;
        const company_res = await db.query(`
            SELECT code, name, description
            FROM companies
            WHERE code = $1`,[code])

        const invoice_res = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [code])

        const industry_res = await db.query(`SELECT industry FROM industries_companies WHERE name = $1`, [code])
        
        if(company_res.rows.length === 0){
            throw new ExpressError(`Unable to locate company: ${code}`,404)
        }

        const company = company_res.rows[0];
        const invoices = invoice_res.rows;
        const industries = industry_res.rows

        company.invoices = invoices
        company.industries = industries
        
        return res.json({company: company})
    } catch (e){
        return next(e)
    }
})

router.post("/", async(req, res, next) => {
    try{

        const {name, description} = req.body;
        const code = slugify(name, {lower: true, strict:true})
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description]);
        
        return res.status(201).json({company: results.rows[0]})
    } catch (e){
        return next(e)
    }
})

router.patch("/:code", async(req,res,next) => {
    try{
        const {code} = req.params;
        const {name, description} = req.body;
        const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`, [name, description, code]);

        if(results.rows.length === 0){
            throw new ExpressError(`Cannot update company with code: ${code}`, 404)
        }

        return res.send({company: results.rows[0]})
    } catch (e) {
        return next(e)
    }
})

router.delete("/:code", async(req,res,next) => {
    try{
        const {code} = req.params
        const results = await db.query(`DELETE FROM companies WHERE code = $1 RETURNING code`, [code]);
        if(results.rows.length === 0){
            throw new ExpressError(`Can't delete company with code of ${code}`, 404)
        }
        return res.send({ status: "deleted"})
    } catch (e) {
        return next(e)
    }
})

module.exports = router