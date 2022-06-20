/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const HostedClusterApiVersion = 'hypershift.openshift.io/v1alpha1'
export type HostedClusterApiVersionType = 'hypershift.openshift.io/v1alpha1'

export const HostedClusterKind = 'HostedCluster'
export type HostedClusterKindType = 'HostedCluster'

export const HostedClusterDefinition: IResourceDefinition = {
    apiVersion: HostedClusterApiVersion,
    kind: HostedClusterKind,
}

export interface HostedCluster extends IResource {
    apiVersion: HostedClusterApiVersionType
    kind: HostedClusterKindType
    metadata: Metadata
    spec: {
        sshKey: {
            name: string
        },
        pullSecret: {
            name: string
        }
    }
    status: {
        kubeadminPassword: {
            name: string
        }
        kubeconfig: {
            name: string
        }
    }
}
