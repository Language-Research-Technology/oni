class State {
  static DELETING = "deleting";
  static INDEXING = "indexing";
  state;
  count = 0;
  constructor() {}
  get isIndexed() {
    return this.count > 0;
  }
  get isIndexing() {
    return this.state === State.INDEXING;
  }
  get isDeleting() {
    return this.state === State.DELETING;
  }
  toJSON() {
    return {
      state: this.state || (this.isIndexed ? 'indexed' : ''),
      count: this.count,
      isIndexed: this.isIndexed,
      isIndexing: this.isIndexing,
      isDeleting: this.isDeleting
    }
  }
}

export class Indexer {
  __state = new State();
  constructor(opt) {}

  static async create({configuration}) {
    const indexer = new this({configuration});
    await indexer.init();
    return indexer;
  }

  async init() {}

  async state() {
    this.__state.count = await this.count();
    return this.__state;
  }

  async _delete() {
    throw new Error('Not Implemented');
  }

  async _index({ ocflObject, crate }) {
    throw new Error('Not Implemented');
  }

  /**
   * @return {Promise<number>}
   */
  async count() {
    throw new Error('Not Implemented');
  }

  async delete() {
    if (this.__state.isIndexing || this.__state.isDeleting) return;
    this.__state.state = State.DELETING;
    await this._delete();
    this.__state.state = '';
  }

  async index({ ocflObject, crate }) {
    if (this.__state.isIndexing || this.__state.isDeleting) return;
    this.__state.state = State.INDEXING;
    await this._index({ ocflObject, crate });
    this.__state.state = '';
  }

}