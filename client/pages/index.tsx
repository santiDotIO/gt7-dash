import type { NextPage } from "next";
import styled from "styled-components";
import Head from "next/head";
import Link from "next/link";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>GT7 - Dash</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container>
        <Link href="/dash/beta">Beta</Link>
      </Container>
    </>
  );
};

export default Home;
