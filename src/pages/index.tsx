import { GetStaticProps } from 'next';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
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
  const { results, next_page } = postsPagination;
  console.log(next_page);

  return (
    <main className={`${commonStyles.content} ${styles.content}`}>
      {results.map(post => (
        <Link href={`/post/${post.uid}`} key={post.uid}>
          <a>
            <h1>{post.data.title}</h1>
            <h2>{post.data.subtitle}</h2>
            <h2>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </h2>
            <h2>{post.data.author}</h2>
          </a>
        </Link>
      ))}
      {postsPagination.next_page && (
        <button type="button">Carregar mais posts</button>
      )}
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

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsResponse.results,
      },
    },
  };
};
