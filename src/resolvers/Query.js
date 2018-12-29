const { forwardTo } = require('prisma-binding');

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  async me(parent, args, ctx, info) {
    // Check if there is a current userId
    if (!ctx.request.userId) {
      return null;
    } else {
      const user = await ctx.db.query.user(
        { where: { id: ctx.request.userId } },
        info
      );
      return user;
    }
  }
};

module.exports = Query;
