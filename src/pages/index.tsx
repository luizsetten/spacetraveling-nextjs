import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  // TODO
  const { results } = postsPagination;
  return (
    <main className={`${commonStyles.content} ${styles.content}`}>
      {results.map(post => (
        <a key={post.uid}>
          <h1>{post.data.title}</h1>
          <h2>{post.data.subtitle}</h2>
          <h2>{post.first_publication_date}</h2>
          <h2>{post.data.author}</h2>
        </a>
      ))}
      <button type="button">Carregar mais posts</button>
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      fetch: ['posts.title', 'posts.content'],
      pageSize: 1,
      page: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      ...post,
      first_publication_date: new Date(
        post.last_publication_date
      ).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    };
  });

  // TODO
  return {
    props: {
      postsPagination: {
        nextPage: 2,
        results: posts,
      },
    },
  };
};
