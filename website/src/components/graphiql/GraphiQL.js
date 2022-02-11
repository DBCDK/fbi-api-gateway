import React from "react";
import GraphiQL from "graphiql";

export default class GraphiQLFix extends GraphiQL {
  componentDidUpdate(...args) {
    const editor = this.getQueryEditor();
    if (editor && this.state.schema) {
      editor.state.lint.linterOptions.schema = this.state.schema;
    }
    return super.componentDidUpdate(...args);
  }
}
