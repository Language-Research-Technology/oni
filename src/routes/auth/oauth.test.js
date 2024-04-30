describe('Test end point /oauth', function () {
  describe('/oauth/:provider/login', function () {
    it('can login to cilogon', async function () {
      const res = await this.app.request('/oauth/cilogon/login');
      expect(res.status).toEqual(200);
      const { url, code_verifier, provider } = await res.json();
      expect(provider).toEqual('cilogon');
      //expect(provider).toEqual('cilogon');
      //console.log(result);
    });
    it('can reject unknown provider', async function () {
      const res = await this.app.request('/oauth/none/login');
      expect(res.status).toEqual(404);
      //expect(provider).toEqual('cilogon');
      //console.log(result);
    });
  });
  describe('/oauth/:provider/code', function () {
    it('can reject unknown provider', async function () {
      const body = JSON.stringify({ code: 'abc'});
      const res = await this.app.request('/oauth/none/code', {method: 'POST', body});
      expect(res.status).toEqual(404);
      //expect(provider).toEqual('cilogon');
      //console.log(result);
    });
  });

});