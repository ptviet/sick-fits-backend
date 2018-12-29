const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Mutation = {
  // Create Item
  async createItem(parent, args, ctx, info) {
    // Check if logged in
    const item = await ctx.db.mutation.createItem(
      {
        data: { ...args }
      },
      info
    );
    return item;
  },

  // Update Item
  async updateItem(parent, args, ctx, info) {
    // Take a copy of the updates
    const updates = { ...args };
    // Remove the ID from the updates
    delete updates.id;
    // Run the update method
    const item = await ctx.db.mutation.updateItem(
      {
        data: updates,
        where: { id: args.id }
      },
      info
    );
    return item;
  },

  // Delete Item
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // Find the Item
    const item = await ctx.db.query.item({ where }, `{id title}`);
    // Check for permission
    //
    // Delete the Item
    const deleted = await ctx.db.mutation.deleteItem({ where }, info);
    return deleted;
  },

  // User Sign Up
  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    // Hash the password
    const password = await bcrypt.hash(args.password, 10);
    // Create user
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] }
        }
      },
      info
    );

    // Create JWT Token
    const token = await jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // Set the jwt as a cookie on the response
    ctx.response.cookie('sickfits_token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    });
    // Return the user
    return user;
  },

  // User Sign In
  async signin(parent, { email, password }, ctx, info) {
    // Check if user exists
    const user = await ctx.db.query.user({ where: { email } }, info);
    if (!user) {
      throw new Error(`No user found with email: ${emnail}`);
    }
    // Verify the password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid password.');
    }
    // Generate JWT Token
    const token = await jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // Set the cookie with the token
    ctx.response.cookie('sickfits_token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    });
    // Return the user
    return user;
  },

  // User Sign Out
  async signout(parent, args, ctx, info) {
    ctx.response.clearCookie('sickfits_token');
    return { message: 'See you later!' };
  }
};

module.exports = Mutation;
