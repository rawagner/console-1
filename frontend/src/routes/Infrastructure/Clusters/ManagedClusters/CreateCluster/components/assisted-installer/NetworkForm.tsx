/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useEffect, useState } from 'react';
import { CIM } from 'openshift-assisted-ui-lib';
import { useRecoilValue, waitForAll } from 'recoil';

import { agentClusterInstallsState, agentsState, clusterDeploymentsState } from '../../../../../../../atoms';
import { AgentKind } from '../../../../../../../resources/agent';
import { patchResource } from '../../../../../../../lib/resource-request';
import { useDeepCompareMemoize } from './use-deep-compare';

const { ACMClusterDeploymentNetworkingStep } = CIM;

type NetworkFormProps = {
  control: any;
  handleCreateResource: any;
  handleChange: any
}

const NetworkForm: React.FC<NetworkFormProps> = ({ control, handleCreateResource, handleChange }) => {
    const [resourceJSON, setResourceJSON] = useState<any>();

    useEffect(() => {
        const resource = handleCreateResource(true); //await
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

    const cdName = resourceJSON?.createResources.find((r: any) => r.kind === 'ClusterDeployment').metadata.name;

    const clusterDeployment = useDeepCompareMemoize(clusterDeployments.find(
        (c) => c.metadata.name === cdName && c.metadata.namespace === cdName
    ));
    const agentClusterInstall = useDeepCompareMemoize(agentClusterInstalls.find(
        (a) => a.metadata.name === cdName && a.metadata.namespace === cdName
    ));

    useEffect(() => control.agentClusterInstall = agentClusterInstall, [control, agentClusterInstall]);

    const agentsMemo = useDeepCompareMemoize(agents);


    const onValuesChanged = useCallback((values) => {
        control.active = values;
        handleChange(control);
    }, []);
    

    return clusterDeployment && agentClusterInstall ? (
        <ACMClusterDeploymentNetworkingStep
          onValuesChanged={onValuesChanged}
          clusterDeployment={clusterDeployment}
          agentClusterInstall={agentClusterInstall}
          pullSecretSet // TODO
          agents={agentsMemo}
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