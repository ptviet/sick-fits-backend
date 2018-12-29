const Mutation = {
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
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // Find the Item
    const item = await ctx.db.query.item({ where }, `{id title}`);
    // Check for permission
    //
    // Delete the Item
    return ctx.db.mutation.deleteItem({ where }, info);
  }
};

module.exports = Mutation;
