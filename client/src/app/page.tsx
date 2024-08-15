'use client'

import { createClient as createWSClient } from 'graphql-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { Client, Provider, cacheExchange, fetchExchange, gql, subscriptionExchange, useQuery, useSubscription } from 'urql';

// const subscriptionClient = new SubscriptionClient('ws://localhost:4000/graphql');
const wsClient = createWSClient({
  url: 'ws://localhost:4000/graphql',
});


const client = new Client({
  url: 'http://localhost:4000/graphql',
  exchanges: [
    cacheExchange,
    fetchExchange,
    subscriptionExchange({
      // forwardSubscription: request => subscriptionClient.request(request),
      forwardSubscription(request) {
        const input = { ...request, query: request.query || '' };
        return {
          subscribe(sink) {
            const unsubscribe = wsClient.subscribe(input, sink);
            return { unsubscribe };
          },
        };
      },
    }),
  ],
});

const queryDocument = gql`
query CurrentNumber {
  currentNumber
}
`

const subscriptionDocument = gql`
subscription IncrementingNumber {
  numberIncremented
}
`

const fontSize = 'text-4xl';

function InProvider() {
  const [subdata, sub] = useSubscription({ query: subscriptionDocument });
  const [querydata, query] = useQuery({ query: queryDocument });

  return <div className="flex flex-col justify-center items-center">
    <p className={fontSize}>current: {querydata.data?.currentNumber ?? 'null'}</p>
    <p className={fontSize}>incremented: {subdata.data?.numberIncremented ?? 'null'}</p>
    <p className={fontSize}>fetching?: {subdata.fetching ? 'yes' : 'no'}</p>
    <button type="button" className="border border-light-50" onClick={() => query()}>current</button>
    <button type="button" className="border border-light-50" onClick={() => sub()}>ws</button>
  </div>
}

export default function Home() {

  return (
    <Provider value={client}>
      <InProvider />
    </Provider>
  );
}
