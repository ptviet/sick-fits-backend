const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

const Query = {
  // Get a list of items
  items: forwardTo('db'),
  // Get a single item
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  // Get Current User
  async me(parent, args, ctx, info) {
    // Check if there is a current userId
    if (!ctx.request.userId) {
      return null;
    }
    // Query the current user
    const user = await ctx.db.query.user(
      { where: { id: ctx.request.userId } },
      info
    );
    return user;
  },
  // Get a list of users
  async users(parent, args, ctx, info) {
    // Check if logged in
    if (!ctx.request.userId) {
      throw new Error('Please login.');
    }
    // Check if user has the permission to query all the users
    hasPermission(ctx.request.user, ['PERMISSIONUPDATE', 'ADMIN']);
    // Query all the users
    const users = await ctx.db.query.users({}, info);
    return users;
  },
  // Get a single order
  async order(parent, args, ctx, info) {
    // Check if logged in
    if (!ctx.request.userId) {
      throw new Error('Please login.');
    }
    // Query the current order
    const order = await ctx.db.query.order({ where: { id: args.id } }, info);
    // Check permission if allowed to see the order
    const ownsOrder = order.user.id === ctx.request.userId;
    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes(
      'ADMIN'
    );
    if (!ownsOrder && !hasPermissionToSeeOrder) {
      throw new Error('Not allowed.');
    }
    // Return the order
    return order;
  },
  // Get a list of orders
  async orders(parent, args, ctx, info) {
    // Check if logged in
    if (!ctx.request.userId) {
      throw new Error('Please login.');
    }
    // Query the orders
    const orders = await ctx.db.query.orders(
      {
        where: {
          user: {
            id: ctx.request.userId
          }
        }
      },
      info
    );
    return orders;
  }
};

module.exports = Query;
