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
  }
};

module.exports = Mutation;
