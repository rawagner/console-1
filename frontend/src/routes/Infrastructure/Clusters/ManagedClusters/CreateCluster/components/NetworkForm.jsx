import * as _ from 'lodash';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { ClusterDeploymentNetworkingStep } from 'openshift-assisted-ui-lib';
import { useRecoilValue, waitForAll } from 'recoil';

import { getAICluster } from './utils';
import { patchResource } from '../../../../../../lib/resource-request';
import { agentClusterInstallsState, agentsState, clusterDeploymentsState } from '../../../../../../atoms';
import { AgentClusterInstallKind } from '../../../../../../resources/agent-cluster-install';
import { AgentKind } from '../../../../../../resources/agent';


export const useDeepCompareMemoize = (value) => {
  const ref = useRef();

  if (!_.isEqual(value, ref.current) ) {
    ref.current = value;
  }

  return ref.current;
};

const appendPatch = (
    patches,
    path,
    newVal,
    existingVal,
) => {
  if (!_.isEqual(newVal, existingVal) && newVal !== '') {
    patches.push({
      op: existingVal ? 'replace' : 'add',
      path,
      value: newVal,
    });
  }
};
  

const NetworkForm = (props) => {
    const [resourceJSON, setResourceJSON] = useState();

    useEffect(() => {
        const resource = props.handleCreateResource(true); //await
        setResourceJSON(resource);
    }, []);

    const [
        clusterDeployments,
        agentClusterInstalls,
        agents,
    ] = useRecoilValue(
        waitForAll([
           clusterDeploymentsState,
           agentClusterInstallsState,
           agentsState
        ])
    )

    const cdName = resourceJSON?.createResources.find((r) => r.kind === 'ClusterDeployment').metadata.name;

    const clusterDeployment = useDeepCompareMemoize(clusterDeployments.find(
        (c) => c.metadata.name === cdName && c.metadata.namespace === cdName
    ));
    const agentClusterInstall = useDeepCompareMemoize(agentClusterInstalls.find(
        (a) => a.metadata.name === cdName && a.metadata.namespace === cdName
    ));

    useMemo(() => props.control.agentClusterInstall = agentClusterInstall, [props.control, agentClusterInstall]);

    const agentsMemo = useDeepCompareMemoize(agents);

    const cluster = useMemo(() =>
        clusterDeployment ? getAICluster({ clusterDeployment, agentClusterInstall, agents: agentsMemo }) : undefined,
        [clusterDeployment, agentClusterInstall, agentsMemo],
    );

    const onSaveNetworking = useCallback(
        async (values) => {
          try {
            const agentClusterInstallPatches = [];
    
            appendPatch(
              agentClusterInstallPatches,
              '/spec/sshPublicKey',
              values.sshPublicKey,
              agentClusterInstall.spec.sshPublicKey,
            );
    
            appendPatch(
              agentClusterInstallPatches,
              '/spec/networking/clusterNetwork',
              [
                {
                  cidr: values.clusterNetworkCidr,
                  hostPrefix: values.clusterNetworkHostPrefix,
                },
              ],
              agentClusterInstall.spec?.networking?.clusterNetwork,
            );
    
            appendPatch(
              agentClusterInstallPatches,
              '/spec/networking/serviceNetwork',
              [values.serviceNetworkCidr],
              agentClusterInstall.spec?.networking?.serviceNetwork,
            );
    
            appendPatch(
              agentClusterInstallPatches,
              '/spec/apiVIP',
              values.apiVip,
              agentClusterInstall.spec?.apiVIP,
            );
    
            appendPatch(
              agentClusterInstallPatches,
              '/spec/ingressVIP',
              values.ingressVip,
              agentClusterInstall.spec?.ingressVIP,
            );
    
            if (agentClusterInstallPatches.length > 0) {
                patchResource(
                    {
                        apiVersion: 'extensions.hive.openshift.io/v1beta1',
                        kind: AgentClusterInstallKind,
                        metadata: {
                            name: agentClusterInstall.metadata.name,
                            namespace: agentClusterInstall.metadata.namespace,
                        },
                    },
                    agentClusterInstallPatches
                )
              

              // await k8sPatch(agentClusterInstallModel, agentClusterInstall, agentClusterInstallPatches);
            }
          } catch (e) {
            throw new Error(`Failed to patch the AgentClusterInstall resource: ${e.message}`);
          }
        },
        [agentClusterInstall],
      );

      const onValuesChange = useCallback((values) => {
        props.control.active = values;
        props.handleChange(props.control);
    }, []);
    

    return cluster ? (
        <ClusterDeploymentNetworkingStep
          onValuesChange={onValuesChange}
          cluster={cluster}
          onSaveNetworking={onSaveNetworking}
          onEditHost={(host) => {
            const agent = agents.find(({ metadata }) => metadata.uid === host.id);
            patchResource(
              {
                  apiVersion: 'agent-install.openshift.io/v1beta1',
                  kind: AgentKind,
                  metadata: {
                      name: agent.metadata.name,
                      namespace: agent.metadata.namespace,
                  },
              },
              [{
                op: 'replace',
                path: '/spec/hostname',
                value: `foo-${Math.floor(Math.random() * 50)}`,
              }]
          )
          }}
        />
     ) : (
        <div>loading</div>
     );
};

export default NetworkForm;