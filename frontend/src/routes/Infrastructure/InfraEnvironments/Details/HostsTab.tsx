/* Copyright Contributors to the Open Cluster Management project */
import { patchResource, deleteResource } from '@open-cluster-management/resources'
import { AcmPageContent } from '@open-cluster-management/ui-components'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import isMatch from 'lodash/isMatch'
import { CIM } from 'openshift-assisted-ui-lib'

import { useRecoilValue, waitForAll } from 'recoil'
import { agentsState } from '../../../../atoms'
import { NavigationPath } from '../../../../NavigationPath'

const { InfraEnvAgentTable } = CIM

type HostsTabProps = {
    infraEnv: CIM.InfraEnvK8sResource
}

const HostsTab: React.FC<HostsTabProps> = ({ infraEnv }) => {
    const [agents] = useRecoilValue(waitForAll([agentsState]))
    const infraAgents = agents.filter((a) =>
        isMatch(a.metadata.labels, infraEnv.status?.agentLabelSelector?.matchLabels)
    )

    return (
        <AcmPageContent id="hosts">
            <PageSection>
                <Card>
                    <CardBody>
                        <InfraEnvAgentTable
                            agents={infraAgents}
                            getClusterDeploymentLink={({ name }) => NavigationPath.clusterDetails.replace(':id', name)}
                            onApprove={(agent) => {
                                patchResource(agent, [
                                    {
                                        op: 'replace',
                                        path: '/spec/approved',
                                        value: true,
                                    },
                                ])
                            }}
                            canDelete={() => true}
                            onDeleteHost={async (agent) => {
                                await deleteResource(agent).promise;
                                if (Object.prototype.hasOwnProperty.call(agent?.metadata?.labels, 'agent-install.openshift.io/bmh')) {
                                    await deleteResource(agent).promise; // TODO delete BMH
                                    await deleteResource(agent).promise; // TODO get BMH mac and delete nmstate
                                }
                            }}
                        />
                    </CardBody>
                </Card>
            </PageSection>
        </AcmPageContent>
    )
}

export default HostsTab
