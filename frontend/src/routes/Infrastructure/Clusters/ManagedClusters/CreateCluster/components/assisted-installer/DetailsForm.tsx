/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useEffect, useState } from 'react';
import { CIM } from 'openshift-assisted-ui-lib';
import { ClusterImageSet, listClusterImageSets } from '../../../../../../../resources/cluster-image-set';

const { ACMClusterDeploymentDetailsStep  } = CIM;

type DetailsFormProps = {
    control: any
    handleChange: any
}

const DetailsForm: React.FC<DetailsFormProps> = ({ control, handleChange }) => {
    const [clusterImages, setClusterImages] = useState<ClusterImageSet[]>([]);
    useEffect(() => {
        const fetchImages = async () => {
            const images = await listClusterImageSets().promise;
            setClusterImages(images);
        }
        fetchImages();
    });
    const onValuesChanged = useCallback((values) => {
        control.active = values;
        if (values.pullSecret) {
            control.active = {
                ...control.active,
                pullSecret: btoa(values.pullSecret),
            }
        }
        handleChange(control);
    }, []);
    return (
        <ACMClusterDeploymentDetailsStep
            onValuesChanged={onValuesChanged}
            clusterImages={clusterImages}
            usedClusterNames={[]}
        />
    );
};

export default DetailsForm;