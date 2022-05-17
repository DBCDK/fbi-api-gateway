import { MDXProvider } from "@mdx-js/react";
import Head from "next/head";
import Link from "@/components/base/link";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Docs from "@/components/docs";

const components = {
  h1: ({ children }) => (
    <Title type="title6" tag="h1">
      {children}
    </Title>
  ),
  h2: ({ children }) => (
    <Title type="title4" tag="h2">
      {children}
    </Title>
  ),
  p: ({ children }) => <Text type="text2">{children}</Text>,
  li: ({ children }) => (
    <li>
      <Text type="text2">{children}</Text>
    </li>
  ),
  a: ({ children, href }) => (
    <Link
      href={href}
      underline
      target={href?.startsWith("http") ? "_blank" : "_self"}
    >
      {children}
    </Link>
  ),
};

export default function Page() {
  return (
    <>
      <Head>
        <title>Gateway 🥳 | Documentation</title>
      </Head>
      <MDXProvider components={components}>
        <Docs />
      </MDXProvider>
    </>
  );
}
