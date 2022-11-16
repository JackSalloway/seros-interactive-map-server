const supertest = require("supertest");
const app = require("./../../app.js");

const locationController = require("./../../controllers/locationController.js");

describe("app", () => {
    describe("/location_data", () => {
        test("calling location_data with required parameters actions correct methods", async () => {
            const addSpy = jest
                .spyOn(locationController.prototype, "mapData")
                .mockImplementation(() => {
                    return {
                        result: "locationData",
                    };
                });

            const result = await supertest(app)
                .get("/location_data?campaign_id=campaignID")
                .expect(200, { result: "locationData" });

            expect(addSpy).toHaveBeenCalledTimes(1);
            expect(addSpy).toHaveBeenCalledWith("campaignID");
            return result;
        });
    });
});
