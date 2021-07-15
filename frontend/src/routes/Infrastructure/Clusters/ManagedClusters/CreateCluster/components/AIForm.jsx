import { useCallback, useEffect, useState } from 'react';
import { ClusterDeploymentDetailsStep } from 'openshift-assisted-ui-lib';
import { listClusterImageSets } from '../../../../../../resources/cluster-image-set';

const imgMap = (clusterImageSet, index) => ({
    label: clusterImageSet.metadata.name,
    value: clusterImageSet.metadata.name, // TODO(mlibra): probably wrong but what is expected here?
    default: index === 0,
    supportLevel: 'beta', // TODO(mlibra): Map from label "channel"
})

const AIForm = ({ control, handleChange, controlData }) => {
    const [ocpImages, setOCPImages] = useState([]);
    useEffect(() => {
        const fetchImages = async () => {
            const images = await listClusterImageSets().promise;
            setOCPImages(images.map(imgMap));
        }
        fetchImages();
    });
    const onValuesChange = useCallback((values) => {
        control.active = values;
        if (values.pullSecret) {
            control.active = {
                ...control.active,
                pullSecret: btoa(values.pullSecret),
            }
        }
        handleChange(control);
    }, []);
    return <ClusterDeploymentDetailsStep onValuesChange={onValuesChange} ocpVersions={ocpImages} usedClusterNames={[]}/>;
};

export default AIForm;