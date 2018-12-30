const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeEmail } = require('../mail');

const Mutation = {
  // Create Item
  async createItem(parent, args, ctx, info) {
    // Check if logged in
    if (!ctx.request.userId) {
      throw new Error('Please login first.');
    }
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          // Provide Item - User relationship
          user: {
            connect: {
              id: ctx.request.userId
            }
          },
          ...args
        }
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
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No user found with email: ${email}`);
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
  },

  // Request To Reset Password
  async requestResetPassword(parent, args, ctx, info) {
    // Check if user exist
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No user found with email: ${args.email}`);
    }
    // Set a reset token and expiry on that user
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1hr from now
    const res = ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    });
    // Email the reset token
    const mailRes = await transport.sendMail({
      from: process.env.PWD_RESET_SENDER,
      to: user.email,
      subject: 'Sick Fits - Password Reset',
      html: makeEmail(
        `Your password reset token is here! \n\n <a href=${
          process.env.FRONTEND_URL
        }/reset?resetToken=${resetToken}>Click here to reset</a>`
      )
    });
    // Return the message
    return { message: 'Request sent.' };
  },

  // Reset Password
  async resetPassword(parent, args, ctx, info) {
    // Check if the passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error("Password don't match.");
    }
    // Verify reset token, check if token expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });
    if (!user) {
      throw new Error('Invalid or expired token.');
    }
    // Hash new password
    const password = await bcrypt.hash(args.password, 10);
    // Save new password, remove resetToken field
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    // Generate JWT
    const token = await jwt.sign(
      { userId: updatedUser.id },
      process.env.APP_SECRET
    );
    // Set the cookie with the token
    ctx.response.cookie('sickfits_token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    });
    // Return the user
    return updatedUser;
  }
};

module.exports = Mutation;
