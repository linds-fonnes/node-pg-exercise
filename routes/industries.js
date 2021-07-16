const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");


const router = new express.Router();

router.post("/", async(req, res, next) => {
    try{

        const {code, industry} = req.body;
        const results = await db.query(`INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry`, [code, industry]);
        
        return res.status(201).json({industry: results.rows[0]})
    } catch (e){
        return next(e)
    }
})

router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(`SELECT code, industry FROM industries`);
        return res.json({ industries: results.rows});
    } catch (e){
        return next(e);
    }
})

router.post("/:ind", async(req, res, next) => {
    try{
        const {ind} = req.params
        const {name} = req.body;
        const results = await db.query(`INSERT INTO industries_companies (industry, name) VALUES ($1, $2) RETURNING industry, name`, [ind, name]);
        
        return res.status(201).json({industry: results.rows[0]})
    } catch (e){
        return next(e)
    }
})


module.exports = router