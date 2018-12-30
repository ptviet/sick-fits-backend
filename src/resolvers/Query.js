const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

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
  },
  async users(parent, args, ctx, info) {
    // Check if logged in
    if (!ctx.request.userId) {
      throw new Error('Please login first.');
    }
    // Check if user has the permission to query all the users
    hasPermission(ctx.request.user, ['PERMISSIONUPDATE', 'ADMIN']);
    // Query all the users
    const users = await ctx.db.query.users({}, info);
    return users;
  }
};

module.exports = Query;
