import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
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

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { results: resultsProps, next_page: nextPageProps } = postsPagination;
  const [posts, setPosts] = useState(resultsProps);
  const [nextPage, setNextPage] = useState(nextPageProps);

  async function loadMorePosts(): Promise<void> {
    const { next_page, results } = await (await fetch(nextPage)).json();
    setPosts([...posts, ...results]);
    setNextPage(next_page);
  }

  return (
    <main className={`${commonStyles.content} ${styles.content}`}>
      {posts.map(post => (
        <Link href={`/post/${post.uid}`} key={post.uid}>
          <a>
            <h1>{post.data.title}</h1>
            <h2>{post.data.subtitle}</h2>
            <div className={styles.info}>
              <span>
                <FiCalendar />
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
              <span>
                <FiUser />
                {post.data.author}
              </span>
            </div>
          </a>
        </Link>
      ))}
      {nextPage && (
        <button type="button" onClick={loadMorePosts}>
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      fetch: ['posts.title', 'posts.content', 'posts.author', 'posts.subtitle'],
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
