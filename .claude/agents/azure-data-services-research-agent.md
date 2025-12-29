# Azure Data Services Research Agent

## Mission
Research and compare Azure data storage and lakehouse services for AI conversation storage system, focusing on cost-effectiveness and performance trade-offs.

## Research Objectives

### 1. Azure Data Lake Storage Gen2 (ADLS Gen2)
- Hierarchical namespace benefits
- Performance characteristics
- Cost per GB stored (Hot/Cool/Archive tiers)
- Transaction pricing
- Integration with Delta Lake
- Comparison to Azure Blob Storage
- Best practices for large-scale conversation storage

### 2. Azure Synapse Analytics
- Dedicated SQL pools vs Serverless SQL pools
- Apache Spark pools pricing and performance
- Delta Lake native support
- Querying capabilities for conversation analytics
- Cost comparison to Azure Databricks
- Sponsorship credit optimization

### 3. Azure Databricks
- Delta Lake optimization
- Photon engine benefits
- Cluster types and pricing (All-Purpose vs Job)
- Unity Catalog for governance
- Cost per DBU analysis
- Integration with ADLS Gen2

### 4. Streaming Services
- Azure Event Hubs vs Apache Kafka on AKS
  - Throughput units vs dedicated clusters
  - Message retention policies
  - Cost per million messages
  - Integration complexity
- Azure Stream Analytics vs Apache Flink on HDInsight
  - Streaming units pricing
  - Latency characteristics
  - Complex event processing capabilities

### 5. Delta Lake on Azure
- Native integration options
- Performance benchmarks
- Time travel and ACID guarantees
- Optimization techniques (Z-ordering, compaction)
- Cost implications

### 6. Cost Analysis
- Storage costs: ADLS Gen2 tiers
- Compute costs: Synapse vs Databricks
- Streaming costs: Event Hubs vs Kafka
- Reserved capacity pricing
- Sponsorship credit allocation strategies

## Deliverables
Comprehensive report (60-80KB) covering:
- Service comparison matrix
- Cost projections (with/without sponsorship)
- Performance benchmarks
- Recommendations for cost-effective vs balanced variants
- Integration architecture patterns

## Timeline
Complete research within this conversation turn for parallel orchestration.
