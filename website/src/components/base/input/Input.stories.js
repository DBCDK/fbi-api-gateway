import { useState } from "react";
import { StoryTitle, StoryDescription } from "@/storybook";

import Input from "./";

export default {
  title: "base/Forms/Input",
};

/**
 * Default input field
 *
 */
export function Default() {
  return (
    <div>
      <StoryTitle>Input field</StoryTitle>
      <StoryDescription>Input default state</StoryDescription>
      <Input />
    </div>
  );
}

/**
 * Default input field
 *
 */
export function Disabled() {
  return (
    <div>
      <StoryTitle>Disabled input field</StoryTitle>
      <StoryDescription>
        Input is disabled for user interaction
      </StoryDescription>
      <Input disabled={true} />
    </div>
  );
}

/**
 * Default input field
 *
 */
export function OnChange() {
  return (
    <div>
      <StoryTitle>Input field onChange</StoryTitle>
      <StoryDescription>
        Input onChange function trigger (console.logs value)
      </StoryDescription>
      <Input
        onChange={(e) => console.log(("input", { value: e.target.value }))}
      />
    </div>
  );
}

/**
 * Default input field
 *
 */
export function OnBlur() {
  return (
    <div>
      <StoryTitle>Input field onBlur</StoryTitle>
      <StoryDescription>
        Input onBlur function trigger (console.logs value)
      </StoryDescription>
      <Input
        onBlur={(e) => console.log(("input", { value: e.target.value }))}
      />
    </div>
  );
}
