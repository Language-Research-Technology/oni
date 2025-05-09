describe('Test structural index', function () {
  /** @type {import('hono').Hono} */
  var app;
  before(function () {
    app = this.app;
  });

  // it('does not index collection without licence', async function () {
  //   let res = await app.request('/object?memberOf=null');
  //   expect(res.status).toEqual(200);
  //   let result = await res.json();
  //   console.log(result);
  //   expect(result.total).toEqual(2);
  // });
});
