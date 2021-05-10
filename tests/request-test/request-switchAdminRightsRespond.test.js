const { createErrorTest } = require('./request-helper/createErrorTestRequest.helper'),
      { adminOneDataComplete, notificationDelegateAdmin, notificationRequestAdmin } = require('../test-data');

const { dbManagement } = require('../db-management-utils');

dbManagement();

const URL_REQUEST = 'switch-admin-rights-respond';

describe("Test switchAdminRightsRespond request controller", () => {
  it("Test 1) send switchAdminRightsRespond request with a bad notification id", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
    );
    
    expect(res.statusCode).toBe(404);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Notification non trouvée!");
  });
  it("Test 2) send switchAdminRightsRespond request with a wrong notification id", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationDelegateAdmin
    );
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Mauvaise notification!");
  });
  it("Test 3) send switchAdminRightsRespond request without acceptedRequest query", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationRequestAdmin
    );
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Besoin d'un paramètre de requête!");
  });
  it("Test 4) send switchAdminRightsRespond request with a wrong acceptedRequest query", async () => {
    const res = await createErrorTest(
      adminOneDataComplete, 
      URL_REQUEST,
      notificationRequestAdmin,
      '?acceptedRequest=oui'
      );
    
    expect(res.statusCode).toBe(400);
    expect(res.error.isBoom).toBe(true);
    expect(res.error.output.payload.message).toMatch("Paramètre de requête invalide!");
  });
});

//Test error
  //OK => Notification non trouvée
  //=> Mauvaise notification
  //=> besoin de la query param acceptedRequest
  //=> besoin de yes ou no dans la query param

//Test request accepted
 // => test statusCode
 // => ancien admin devient user
 // => ancien user devient admin
 // => test transform notification need-switch-admin en invite normal pour l'ancien admin
 // => test transform notification invite normal en need-switch-admin pour le nouvel admin
 // => test nouvel userId dans household
 // => test nouvel admin en position une du tableau des membres de household
 // => test request notification deleted

//Test request rejected
 // => test statusCode
 // => test request notification deleted
 // => test notification d'information du refus créer

