import { MDXProvider } from "@mdx-js/react";
import { MDXRemote } from "next-mdx-remote";
import Head from "next/head";
import Layout from "@/components/base/layout";
import Header from "@/components/header";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Docs from "@/components/docs";

const components = {
  h1: ({ children }) => (
    <Title type="title3" tag="h1">
      {children}
    </Title>
  ),
  h2: ({ children }) => (
    <Title type="title1" tag="h2">
      {children}
    </Title>
  ),
  p: ({ children }) => <Text type="text1">{children}</Text>,
};

export default function Page() {
  return (
    <>
      <Head>
        <title>Documentation</title>
      </Head>
      <MDXProvider components={components}>
        <Docs />
      </MDXProvider>
    </>
  );
}
