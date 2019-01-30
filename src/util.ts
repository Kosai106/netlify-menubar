import { NotificationConstructorOptions } from 'electron'; // tslint:disable-line no-implicit-dependencies
import { IAppDeploys } from './menubar';
import { INetlifyDeploy } from './netlify';

interface IDeploysReduceAcc {
  pending: INetlifyDeploy[];
  ready: INetlifyDeploy[];
  foundReadyDeploy: boolean;
}

const isReady = (deploy: INetlifyDeploy) => deploy.state === 'ready';
const isError = (deploy: INetlifyDeploy) => deploy.state === 'error';
const isSkipped = (deploy: INetlifyDeploy) =>
  deploy.state === 'error' && deploy.error_message === 'Skipped';
const isDifferentDeploy = (prev: INetlifyDeploy, current: INetlifyDeploy) =>
  prev.id !== current.id;
const isDifferentDeployState = (
  prev: INetlifyDeploy,
  current: INetlifyDeploy
) => prev.state !== current.state;

/**
 *
 * @param previous {INetlifyDeploy}
 * @param current {INetlifyDeploy}
 * @returns INotification | null
 * @tested
 */
export const getNotificationOptions = (
  previous: INetlifyDeploy,
  current: INetlifyDeploy
): NotificationConstructorOptions | null => {
  if (isDifferentDeploy(previous, current)) {
    return {
      body: `New deploy state: ${current.state}`,
      title: 'New deploy started'
    };
  } else if (isDifferentDeployState(previous, current)) {
    return {
      body: `Deploy state: ${current.state}`,
      title: 'Deploy progressed'
    };
  }

  return null;
};

/**
 *
 * @param deploys {INetlifyDeploy[]}
 * @returns IAppDeploys
 * @tested
 */
export const getFormattedDeploys = (deploys: INetlifyDeploy[]): IAppDeploys => {
  const formattedDeploys = deploys.reduce(
    (acc: IDeploysReduceAcc, deploy: INetlifyDeploy): IDeploysReduceAcc => {
      if (
        !acc.foundReadyDeploy &&
        (isReady(deploy) || isError(deploy) || isSkipped(deploy))
      ) {
        acc.foundReadyDeploy = true;
      }

      if (acc.foundReadyDeploy) {
        acc.ready.push(deploy);
      } else {
        acc.pending.push(deploy);
      }

      if (deploy.state === 'error' && deploy.error_message === 'Skipped') {
        deploy.state = 'skipped';
      }

      return acc;
    },
    { pending: [], ready: [], foundReadyDeploy: false }
  );

  return {
    pending: formattedDeploys.pending,
    ready: formattedDeploys.ready
  };
};

/**
 *
 * @param deployCount
 * @tested
 */
export const getSuspendedDeployCount = (deployCount: number): string => {
  if (deployCount > 0) {
    return `${
      deployCount > 9
        ? String.fromCharCode(8329) + '₊'
        : String.fromCharCode(8320 + deployCount)
    }`;
  } else {
    return '';
  }
};
