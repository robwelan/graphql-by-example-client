import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from 'apollo-boost';
import gql from 'graphql-tag';
import { getAccessToken, isLoggedIn } from './auth';

const endpointURL = 'http://localhost:9000/graphql';

const authLink = new ApolloLink((operation, forward) => {
  if (isLoggedIn()) {
  //  request.headers['authorization'] = 'Bearer ' + getAccessToken();
    operation.setContext({
      headers: {
        'authorization': `Bearer ${getAccessToken()}`,
      }
    });
  }

  return forward(operation);
});

const client = new ApolloClient({
  link: ApolloLink.from([
    authLink,
    new HttpLink({ uri: endpointURL }),
  ]),
  cache: new InMemoryCache(),
});

// const graphqlRequest = async (query, variables = {}) => {
//   const request = {
//     method: 'POST',
//     headers: { 'content-type': 'application/json' },
//     body: JSON.stringify({ query, variables })
//   };

//   if (isLoggedIn()) {
//     request.headers['authorization'] = 'Bearer ' + getAccessToken();
//   }

//   const response = await fetch(endpointURL, request);

//   const responseBody = await response.json();

//   if (responseBody.errors) {
//     const message = responseBody.errors.map((error) => error.message).join('\n');

//     throw new Error(message);
//   }

//   return responseBody.data;
// }

const jobDetailFragment = gql`
  fragment JobDetail on Job {
    id
    description
    company {
      id
      name
    }
    title
  }
`;

const createJobMutation = gql`
  mutation CreateJob($input: CreateJobInput) {
    job: createJob(input: $input) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;

const companyQuery = gql`
  query CompanyQuery($id: ID!) {
    company(id: $id) {
      id
      name
      description
      jobs {
        id
        title
        description
      }
    }
  }
`;

const jobQuery = gql`
  query JobQuery($id: ID!) {
    job(id: $id) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;

const jobsQuery = gql`
  query JobsQuery {
    jobs {
      id
      title
      company {
        id
        name
      }
    }
  }
`;

export const createJob = async (input) => {
//  const { job } = await graphqlRequest(mutation, {input});
  const { data: { job } } = await client.mutate({
    mutation: createJobMutation,
    variables: { input },
    update: (cache, mutationResult) => {
      const { data } = mutationResult;

      cache.writeQuery({
        query: jobQuery,
        variables: { id: data.job.id },
        data
      });
    }
  });
  return job;
};

export const loadCompany = async (id) => {
  const { data: { company } } = await client.query({ query: companyQuery, variables: { id } });
//  const { company } = await graphqlRequest(query, {id});

  return company;
};

export const loadJob = async (id) => {
  //const { job } = await graphqlRequest(query, {id});
  // const response = await fetch(endpointURL, {
  //   method: 'POST',
  //   headers: { 'content-type': 'application/json' },
  //   body: JSON.stringify({
  //     query: `
  //     query JobQuery($id: ID!) {
  //       job(id: $id) {
  //         id
  //         title
  //         company {
  //           id
  //           name
  //         }
  //         description
  //       }
  //     }
  //     `, variables: { id }
  //   })
  // });

  // const responseBody = await response.json();

  // return responseBody.data.job;
  const { data: { job } } = await client.query({query: jobQuery, variables: { id } });
  return job;
}

export const loadJobs = async () => {
  // const response = await fetch(endpointURL, {
  //   method: 'POST',
  //   headers: { 'content-type': 'application/json' },
  //   body: JSON.stringify({
  //     query: `
  //     {
  //       jobs {
  //         id
  //         title
  //         company {
  //           id
  //           name
  //         }
  //       }
  //     }
  //     `
  //   })
  // });

  // const responseBody = await response.json();

  // return responseBody.data.jobs;
   // const { jobs } = await graphqlRequest(query);
  const { data: { jobs } } = await client.query({ query: jobsQuery, fetchPolicy: 'no-cache' });
  return jobs;
}
