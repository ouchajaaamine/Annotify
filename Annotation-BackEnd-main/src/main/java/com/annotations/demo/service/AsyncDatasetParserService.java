package com.annotations.demo.service;

import com.annotations.demo.entity.Dataset;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AsyncDatasetParserService {

    @Autowired
    private DatasetService datasetService;

    @Async
    public void parseDatasetAsync(Dataset dataset) {
        datasetService.ParseDataset(dataset);
    }
}
