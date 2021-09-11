import { useEffect } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  nextPost: {
    title: string;
    slug: string;
  };
  previousPost: {
    title: string;
    slug: string;
  };
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
}

export default function Post({ post, preview }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  const { nextPost, previousPost } = post;

  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-utterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute('repo', 'luizsetten/spacetraveling-nextjs');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'dark-blue');
    anchor.appendChild(script);
  }, []);

  if (isFallback)
    return <div className={commonStyles.content}>Carregando...</div>;

  const words = post.data.content.reduce((acc, content) => {
    return acc + RichText.asText(content.body).split(' ').length;
  }, 0);

  console.log(post);

  return (
    <div className={styles.content}>
      <article className={commonStyles.content}>
        <img
          src={post.data.banner.url}
          alt={post.data.title}
          className={styles.banner}
        />
        <main>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <div>
              <time>
                <FiCalendar />
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
              <span>
                <FiUser />
                {post.data.author}
              </span>
              <span>
                <FiClock />
                {Math.ceil(Number(words / 200))} min
              </span>
            </div>
            {post.last_publication_date && (
              <div className={styles.edit}>
                <time>
                  * editado em{' '}
                  {format(
                    new Date(post.last_publication_date),
                    "dd MMM yyyy, 'às' hh:mm",
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
              </div>
            )}
          </div>
          {post.data.content.map(content => (
            <div key={content.heading}>
              <span>{content.heading}</span>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </main>
      </article>
      <div className={styles.pagination}>
        {previousPost ? (
          <div>
            <span>{previousPost.title}</span>
            <Link href={`/post/${previousPost.slug}`}>
              <a>Post anterior</a>
            </Link>
          </div>
        ) : (
          <div />
        )}
        {nextPost && (
          <div className={styles.next}>
            <span>{nextPost.title}</span>
            <Link href={`/post/${nextPost.slug}`}>
              <a>Próximo post</a>
            </Link>
          </div>
        )}
      </div>
      <div id="inject-utterances" />

      {preview && (
        <aside className={commonStyles.exitPreview}>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts')
  );

  const paths = posts.results.map(post => {
    return { params: { slug: post.uid } };
  });

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts')
  );

  const postsWithExtra = posts.results.map((post, index, arr) => {
    if (post.uid === String(slug))
      return {
        ...post,
        nextPost: arr[index + 1]
          ? {
              title: arr[index + 1]?.data?.title,
              slug: arr[index + 1]?.uid,
            }
          : null,
        previousPost: arr[index - 1]
          ? {
              title: arr[index - 1]?.data?.title,
              slug: arr[index - 1]?.uid,
            }
          : null,
        ref: previewData?.ref ?? null,
      };
    return post;
  });

  const result = postsWithExtra.find(post => post.uid === String(slug));

  return {
    props: {
      post: result,
      preview,
    },
  };
};
