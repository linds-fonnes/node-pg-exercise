process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('msft','Microsoft','Bill Gates!') RETURNING code, name, description`);
    testCompany = result.rows
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`)
})

afterAll(async () => {
    await db.end()
})

describe("GET /companies", () => {
    test("Get a list of companies", async () => {
        const res = await request(app).get("/companies");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({companies: [
            {
                "code": testCompany[0].code,
                "name": testCompany[0].name
            }
        ]})
    })
})

describe("GET /companies/:code", () =>{
    test("gets a single company", async () => {
        const invoice_res = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('msft', 100) RETURNING id`)
        const res = await request(app).get(`/companies/${testCompany[0].code}`);
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({company: 
        {
            "code": testCompany[0].code,
            "name" : testCompany[0].name,
            "description": testCompany[0].description,
            "invoices" : invoice_res.rows
        }
        })
    })
    test("responses with 404 for invalid code", async () => {
        const res = await request(app).get("/companies/foo")
        expect(res.statusCode).toBe(404)
    })
})

describe("POST /companies", () => {
    test("Creates a single company", async () => {
        const res = await request(app).post("/companies").send({code: "bar", name: "test"});
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({
            company: {
                code: "bar",
                name: "test",
                description: null
            }
        })
    })
})

describe("PATCH /companies/:code", () => {
    test("updates a single company", async () => {
        const res = await request(app).patch(`/companies/${testCompany[0].code}`).send({name: "patched", description: "testing patch route"});
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            company: {
                code: `${testCompany[0].code}`,
                name: "patched",
                description: "testing patch route"
            }
        })
    })

    test("responds with 404 for invalid code", async () => {
        const res = await request(app).patch("/companies/foo").send({name: "patched", description: "testing patch route"});
        expect(res.statusCode).toBe(404)
    })
})

describe("DELETE /companies/:code", () => {
    test("Deletes a single company", async () => {
        const res = await request(app).delete(`/companies/${testCompany[0].code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: "deleted"})
    })

    test("responds with error for invalid code", async () => {
        const res = await request(app).delete(`/companies/foo`);
        expect(res.statusCode).toBe(404)
    })
})