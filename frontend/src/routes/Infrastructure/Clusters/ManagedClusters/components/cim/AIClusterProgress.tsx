/* Copyright Contributors to the Open Cluster Management project */
import { AcmExpandableCard } from '@open-cluster-management/ui-components';
import { Stack, StackItem } from '@patternfly/react-core';
import { expandable, sortable } from '@patternfly/react-table';
import { CIM } from 'openshift-assisted-ui-lib'
import { useContext } from 'react';
import { ClusterContext } from '../../ClusterDetails/ClusterDetails';

const { ClusterProgress, HostsTable, getAICluster } = CIM;

const columns = [
    { title: 'Hostname', transforms: [sortable], cellFormatters: [expandable] },
    { title: 'Role', transforms: [sortable] },
    { title: 'Status', transforms: [sortable] },
    { title: 'Discovered At', transforms: [sortable] },
    { title: 'CPU Cores', transforms: [sortable] }, // cores per machine (sockets x cores)
    { title: 'Memory', transforms: [sortable] },
    { title: 'Disk', transforms: [sortable] },
    { title: '' },
  ];

const AIClusterProgress: React.FC = () => {
    const { clusterDeployment, agentClusterInstall, agents } = useContext(ClusterContext)
    const cluster = getAICluster({ clusterDeployment, agentClusterInstall, agents });
    return (
        <div style={{ marginBottom: '24px' }}>
            <AcmExpandableCard title="Cluster installation progress" id="aiprogress">
                <Stack hasGutter>
                    <StackItem>
                        <ClusterProgress cluster={cluster} onFetchEvents={async () => {} }/>
                    </StackItem>
                    <StackItem>
                        <HostsTable
                            hosts={cluster.hosts}
                            EmptyState={() => <div>empty</div>}
                            columns={columns}
                            className="agents-table"
                        />
                    </StackItem>
                </Stack>
            </AcmExpandableCard>
        </div>
    )
}

export default AIClusterProgress