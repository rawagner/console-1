
/* Copyright Contributors to the Open Cluster Management project */

import {
    Cluster,
    HostedClusterApiVersion,
    HostedClusterKind,
    IResource,
    KlusterletAddonConfigApiVersion,
    KlusterletAddonConfigKind,
    ManagedClusterApiVersion,
    ManagedClusterKind,
    NodePoolApiVersion,
    NodePoolKind,
    ResourceError,
    SecretApiVersion,
    SecretKind,
} from '../resources'
import { deleteResources } from './delete-resources'

export function deleteHypershiftCluster(cluster: Cluster) {
    const resources: IResource[] = [
        {
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterKind,
            metadata: { name: cluster.name!, namespace: cluster.namespace! },
        },
        {
            apiVersion: KlusterletAddonConfigApiVersion,
            kind: KlusterletAddonConfigKind,
            metadata: { name: cluster.name!, namespace: cluster.namespace! },
        },
        {
            apiVersion: HostedClusterApiVersion,
            kind: HostedClusterKind,
            metadata: { name: cluster.name!, namespace: cluster.namespace! },
        },
    ]
    cluster.hypershift?.nodePools?.forEach((np) => {
        resources.push({
            apiVersion: NodePoolApiVersion,
            kind: NodePoolKind,
            metadata: { name: np, namespace: cluster.namespace! },
        })
    })

    cluster.hypershift?.secrets?.forEach((secret) => {
        resources.push({
            apiVersion: SecretApiVersion,
            kind: SecretKind,
            metadata: { name: secret, namespace: cluster.namespace! },
        })
    })

    const deleteResourcesResult = deleteResources(resources)

    return {
        promise: new Promise((resolve, reject) => {
            deleteResourcesResult.promise.then((promisesSettledResult) => {
                if (promisesSettledResult[0]?.status === 'rejected') {
                    const error = promisesSettledResult[0].reason
                    if (error instanceof ResourceError) {
                        reject(promisesSettledResult[0].reason)
                            return
                    }
                }
                if (promisesSettledResult[1]?.status === 'rejected') {
                    reject(promisesSettledResult[1].reason)
                    return
                }
                resolve(promisesSettledResult)
            })
        }),
        abort: deleteResourcesResult.abort,
    }
}