import Label from "./";
import Input from "../input/";

import { StoryTitle, StoryDescription } from "@/storybook";

export default {
  title: "Base/Forms/Label",
};

export function Default() {
  return (
    <div>
      <StoryTitle>Label </StoryTitle>
      <Label>Some example label</Label>
    </div>
  );
}

export function Loading() {
  return <Label skeleton={true}> Some example label </Label>;
}

export function LabelForInput() {
  return (
    <div>
      <Label for="input">Label for input</Label>
      <Input id="input" />
    </div>
  );
}
