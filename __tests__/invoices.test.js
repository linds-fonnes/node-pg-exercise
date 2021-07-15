process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testInvoice;

beforeEach(async () => {
    const company_res = await db.query(`INSERT INTO companies (code, name, description) VALUES ('foo','bar','testing') RETURNING code, name, description`)
    const result = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('foo',100) RETURNING id, amt, add_date, paid_date, paid, comp_code`);

    testInvoice = result.rows[0]
    testCompany = company_res.rows[0]
})

afterEach(async () => {
    await db.query(`DELETE FROM invoices`)
    await db.query(`DELETE FROM companies`)
})

afterAll(async () => {
    await db.end()
})

describe("GET /invoices", () => {
    test("Get a list of invoices", async () => {
        const res = await request(app).get("/invoices");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({invoices: [
            { id: testInvoice.id,
              comp_code: testInvoice.comp_code
            }
        ]})
    })
})

describe("GET /invoices/:id", () =>{
    test("gets a single invoice", async () => {
        const invoice_res = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(invoice_res.statusCode).toBe(200)
        expect(invoice_res.body).toEqual({
            invoice: {
                id: testInvoice.id,
                amt: testInvoice.amt,
                add_date: "2021-07-15T06:00:00.000Z",
                paid_date: testInvoice.paid_date,
                paid: testInvoice.paid,
                company: {
                    code: testCompany.code,
                    name: testCompany.name,
                    description: testCompany.description
                }
            }
        })
    })
    test("responses with 404 for invalid id", async () => {
        const res = await request(app).get("/invoices/00009")
        expect(res.statusCode).toBe(404)
    })
})

describe("POST /invoices", () => {
    test("Creates a single invoice", async () => {
        const res = await request(app).post("/invoices").send({comp_code: "foo", amt: 101});
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({
            "invoice" : {
                id: expect.any(Number),
                comp_code: "foo",
                amt: 101,
                add_date: expect.any(String),
                paid: false,
                paid_date: null
            }
        })
    })
})

describe("PATCH /invoices/:id", () => {
    test("updates a single invoice", async () => {
        const res = await request(app).patch(`/invoices/${testInvoice.id}`).send({amt: 999});
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: "foo",
                amt: 999,
                add_date: expect.any(String),
                paid: false,
                paid_date: null
            }
        })
    })

    test("responds with 404 for invalid id", async () => {
        const res = await request(app).patch("/invoices/00009").send({amt: 800});
        expect(res.statusCode).toBe(404)
    })
})

describe("DELETE /invoices/:id", () => {
    test("Deletes a single invoice", async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: "deleted"})
    })

    test("responds with error for invalid code", async () => {
        const res = await request(app).delete(`/invoices/0`);
        expect(res.statusCode).toBe(404)
    })
})